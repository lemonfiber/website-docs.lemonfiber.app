#!/usr/bin/env node
/**
 * The stable pin set: written from what a release recorded, checked against it,
 * and checked out for a build (REPO-R88).
 *
 *   node scripts/stable.ts check              refuse a stable pin the rule does not give
 *   node scripts/stable.ts write [version]    write pins/stable.toml for a release
 *   node scripts/stable.ts write <version> --out <file>
 *   node scripts/stable.ts kept               the kept releases that have settled, as JSON lines
 *   node scripts/stable.ts checkout [file]    check every submodule out at the file's pins
 *
 * The rule is `src/lib/stable.ts`. This asks git: the specification's manifests
 * on its default branch, the core's tags, and each repository's history.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import {
  declaredBranches,
  declaredUrls,
  DEFAULT_BRANCH,
  WINDOW_SECONDS,
} from "@lemonfiber/website-kit/pins";

import {
  keptReleases,
  MANIFESTS,
  parseStable,
  releaseOf,
  renderStable,
  settledAt,
  sourceOf,
  stableOf,
  STABLE,
  stableFaults,
  type Expected,
  type Release,
  type Source,
} from "../src/lib/stable.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const SPEC = "vendor/spec";

// Named by absolute path and run with `PATH` pinned, for the reason the kit's
// pin check gives: nothing a step before this one put on `PATH` stands in.
const GIT = [
  "/usr/bin/git",
  "/usr/local/bin/git",
  "/opt/homebrew/bin/git",
].find((path) => existsSync(path));
const SYSTEM_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";

function stop(message: string): never {
  console.error(`::error::${message}`);
  process.exit(1);
}

if (GIT === undefined) stop("no git could be found");

const git = (...args: string[]): { ok: boolean; out: string } => {
  const done = spawnSync(GIT, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 26,
    env: { ...process.env, PATH: SYSTEM_PATH },
  });
  return { ok: done.status === 0, out: done.stdout.trim() };
};

const config = git(
  "config",
  "-f",
  ".gitmodules",
  "--get-regexp",
  String.raw`^submodule\.`,
).out;
const urls = declaredUrls(config);
const branches = declaredBranches(config);

/** The repository a submodule is cloned from, by name. */
const repositoryOf = (module: string): string => {
  const url = (urls.get(module) ?? module).replace(/\.git$/, "");
  return url.slice(url.lastIndexOf("/") + 1);
};

/** Every released version the specification's default branch records. */
function releases(): Release[] {
  if (!git("-C", SPEC, "fetch", "--quiet", "origin", DEFAULT_BRANCH).ok)
    stop("the specification could not be fetched");
  const listed = git(
    "-C",
    SPEC,
    "ls-tree",
    "--name-only",
    "FETCH_HEAD",
    `${MANIFESTS}/`,
  );
  return listed.out
    .split("\n")
    .filter((path) => /\/\d+\.\d+\.\d+\.toml$/.test(path))
    .map((path) => releaseOf(git("-C", SPEC, "show", `FETCH_HEAD:${path}`).out))
    .filter((one): one is Release => one !== null);
}

/** The whole history of a submodule's default branch, fetched. */
function fetchBranch(module: string): string | null {
  const branch = branches.get(module) ?? DEFAULT_BRANCH;
  if (git("-C", module, "rev-parse", "--is-shallow-repository").out === "true")
    git("-C", module, "fetch", "--quiet", "--unshallow", "origin", branch);
  if (!git("-C", module, "fetch", "--quiet", "origin", branch).ok) return null;
  return "FETCH_HEAD";
}

/** The commit `source` names in `module`, or null where git cannot say. */
const UNREAD: Expected = { kind: "unread" };
const commit = (sha: string): Expected => ({ kind: "commit", commit: sha });

function expectedOf(module: string, source: Source): Expected {
  switch (source.kind) {
    case "manifest":
      return commit(source.commit);
    case "tag": {
      if (
        !git("-C", module, "fetch", "--quiet", "origin", "tag", source.tag).ok
      )
        return UNREAD;
      const found = git("-C", module, "rev-parse", `${source.tag}^{commit}`);
      return found.ok ? commit(found.out) : UNREAD;
    }
    case "day": {
      const head = fetchBranch(module);
      if (head === null) return UNREAD;
      const found = git(
        "-C",
        module,
        "rev-list",
        "-1",
        `--before=${source.day}T23:59:59Z`,
        head,
      );
      if (!found.ok) return UNREAD;
      return found.out === "" ? { kind: "absent" } : commit(found.out);
    }
  }
}

/** What the rule gives every submodule for `release`, and where each came from. */
function expectedFor(release: Release): {
  rules: Map<string, Expected>;
  sources: Record<string, Source>;
} {
  const rules = new Map<string, Expected>();
  const sources: Record<string, Source> = {};
  for (const module of urls.keys()) {
    const source = sourceOf(repositoryOf(module), release);
    sources[module] = source;
    rules.set(module, expectedOf(module, source));
  }
  return { rules, sources };
}

const [command = "check", ...rest] = process.argv.slice(2);

const kept = (): Release[] => keptReleases(releases());

/**
 * The release `version` names, or the newest kept one whose pins have settled.
 * One released today is refused: its day is not over, so a commit can still
 * join the ones on or before it and the set would not be the one a later check
 * gives.
 */
const releaseNamed = (version: string | undefined): Release => {
  const now = Math.floor(Date.now() / 1000);
  const all = kept();
  const found =
    version === undefined
      ? all.filter((one) => settledAt(one) <= now).at(-1)
      : all.find(
          (one) =>
            one.version === version || one.version.startsWith(`${version}.`),
        );
  if (found === undefined)
    stop(`${version ?? "no version"} is not a kept released version`);
  if (settledAt(found) > now)
    stop(
      `${found.version} was released today, and its pins settle at midnight UTC`,
    );
  return found;
};

switch (command) {
  case "kept": {
    // Only a release whose pins have settled: one released today could still
    // gain a commit, and a frozen build of it would not be what it recorded.
    const now = Math.floor(Date.now() / 1000);
    for (const release of kept().filter((one) => settledAt(one) <= now))
      console.log(JSON.stringify(release));
    break;
  }

  case "write": {
    const out = rest.includes("--out")
      ? rest[rest.indexOf("--out") + 1]
      : STABLE;
    const release = releaseNamed(
      rest.find((one) => !one.startsWith("--") && one !== out),
    );
    const { rules, sources } = expectedFor(release);
    const { stable, unread } = stableOf(release.version, rules);
    if (unread.length > 0)
      stop(`no commit could be read for ${unread.join(", ")}`);
    writeFileSync(`${ROOT}${out ?? STABLE}`, renderStable(stable, sources));
    console.log(
      `stable: ${out ?? STABLE} holds what ${release.version} recorded`,
    );
    break;
  }

  case "checkout": {
    const file = rest[0] ?? STABLE;
    const stable = parseStable(readFileSync(`${ROOT}${file}`, "utf8"));
    if (stable === null) stop(`${file} holds no stable pin set`);
    for (const [module, commit] of Object.entries(stable.pins)) {
      git("-C", module, "fetch", "--quiet", "origin", commit);
      if (!git("-C", module, "checkout", "--quiet", "--detach", commit).ok)
        stop(`${module} could not be checked out at ${commit}`);
    }
    console.log(`stable: every submodule at what ${stable.version} recorded`);
    break;
  }

  case "check": {
    const stable = parseStable(readFileSync(`${ROOT}${STABLE}`, "utf8"));
    if (stable === null) stop(`${STABLE} holds no stable pin set`);
    const all = kept();
    const release = all.find((one) => one.version === stable.version);
    if (release === undefined)
      stop(
        `${STABLE} renders ${stable.version}, which is not a kept released version`,
      );
    const faults = stableFaults(
      stable,
      expectedFor(release).rules,
      all.at(-1) ?? null,
      Math.floor(Date.now() / 1000),
      WINDOW_SECONDS,
    );
    if (faults.length > 0) {
      for (const fault of faults)
        console.error(`${fault.module ?? STABLE}  ${fault.message}`);
      stop(
        `${String(faults.length)} stable pin(s) are not what the release recorded; \`node scripts/stable.ts write\` writes the set the rule gives`,
      );
    }
    console.log(`stable: every pin is what ${stable.version} recorded`);
    break;
  }

  default:
    stop(`unknown command ${command}`);
}

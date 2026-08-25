#!/usr/bin/env node
/** Fetches the pinned repositories and applies the rules in src/lib/pins.ts. */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

import {
  declaredBranches,
  DEFAULT_BRANCH,
  GUARDED,
  parseCommits,
  pinnedRevisions,
  report,
  watched,
  type Behind,
} from "../src/lib/pins.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const FORMAT = "--format=%h%x09%cs%x09%s";

// A command named on its own is whichever one `PATH` reaches first, and `PATH`
// on a runner is what the steps before this one prepended to it. Both ends are
// closed here: the binary is named by absolute path, so nothing on `PATH` can
// stand in for it, and `PATH` is then pinned to the system directories, so
// nothing git resolves for itself can be substituted either. These are the
// three places a package manager installs git.
const CANDIDATES = [
  "/usr/bin/git",
  "/usr/local/bin/git",
  "/opt/homebrew/bin/git",
];
const SYSTEM_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";

const GIT = CANDIDATES.find((path) => existsSync(path));
if (GIT === undefined) {
  console.error(`pins: no git at ${CANDIDATES.join(", ")}`);
  process.exit(1);
}

const git = (...args: string[]): { ok: boolean; out: string } => {
  const done = spawnSync(GIT, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 26,
    env: { ...process.env, PATH: SYSTEM_PATH },
  });
  return { ok: done.status === 0, out: done.stdout.trim() };
};

const status = git("submodule", "status");
if (!status.ok) {
  console.error("pins: the submodules could not be read");
  process.exit(1);
}

const pinned = pinnedRevisions(status.out);
const branches = declaredBranches(
  git("config", "-f", ".gitmodules", "--get-regexp", String.raw`^submodule\.`)
    .out,
);
const reads = watched(GUARDED, [...pinned.keys()]);

// A guard whose source resolves to no pinned repository is a guard this check
// is not watching, and an empty list would read as a clean run.
if (reads.length === 0) {
  console.error("pins: no guarded source sits in a pinned repository");
  process.exit(1);
}

const behind: Behind[] = [];
const unreadable: string[] = [];
const fetched = new Set<string>();

for (const read of reads) {
  const pin = pinned.get(read.module) ?? "";
  const branch = branches.get(read.module) ?? DEFAULT_BRANCH;

  // A fetch that failed leaves a remote-tracking ref that is itself behind, and
  // the comparison would come back clean off it.
  if (!fetched.has(read.module)) {
    fetched.add(read.module);
    if (!git("-C", read.module, "fetch", "--quiet", "origin").ok)
      unreadable.push(`${read.module}: origin could not be fetched`);
  }

  const range = `${pin}..origin/${branch}`;
  const args = ["-C", read.module, "log", FORMAT, range];
  if (read.path !== "") args.push("--", read.path);

  const log = git(...args);
  if (!log.ok) {
    unreadable.push(`${read.module}: ${range} could not be read`);
    continue;
  }

  const commits = parseCommits(log.out);
  if (commits.length > 0)
    behind.push({ ...read, pin: pin.slice(0, 7), commits });
}

console.log(
  `pins: ${String(reads.length)} guarded paths, in ${String(fetched.size)} pinned repositories`,
);

if (behind.length > 0) {
  console.error(`\n${report(behind)}`);
  console.error(
    "::error::a guard is reading a source its pin has gone behind on, so the guard " +
      "can be green and the page wrong. Bump it with `git submodule update --remote " +
      "<path>` and re-run `npm run guard`.",
  );
}

if (unreadable.length > 0) {
  console.error(`\n${unreadable.join("\n")}`);
  console.error(
    "::error::a pinned repository could not be compared with its default branch, so " +
      "what it holds is unknown rather than current.",
  );
}

if (behind.length === 0 && unreadable.length === 0)
  console.log("every pin has taken every commit touching what a guard reads.");

process.exit(behind.length + unreadable.length === 0 ? 0 : 1);

#!/usr/bin/env node
/** Fetches the pinned repositories and applies the rules in src/lib/pins.ts. */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync } from "node:fs";

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

// What the run page shows above the log. The verdict is written there as well
// as printed, so what this check found and what it is for are read together —
// the reader who has to be told it reports rather than gates is the one who did
// not go looking for the workflow file.
const SUMMARY = process.env["GITHUB_STEP_SUMMARY"];

const say = (line = ""): void => {
  console.log(line);
  if (SUMMARY !== undefined) appendFileSync(SUMMARY, `${line}\n`);
};

const fenced = (lines: readonly string[]): void => {
  say("```");
  for (const one of lines) say(one);
  say("```");
};

/**
 * A red this check could not compose a finding for.
 *
 * It never reached a comparison, so it has nothing to say about any pin. A run
 * that ends here and says nothing is the case this whole check exists to make
 * legible, one layer down: red, gating nothing, and indistinguishable from the
 * red it is meant to raise.
 */
function stopped(heading: string, detail: string): never {
  say(`## ${heading}`);
  say();
  say("**This check reports; it gates nothing.** It did not get as far as a");
  say(
    "comparison, so nothing here is a pin that has gone behind — the run could",
  );
  say("not read what it reads.");
  say();
  fenced([detail]);
  console.error(`::error::${detail} — this check reports it and gates nothing`);
  process.exit(1);
}

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
if (GIT === undefined)
  stopped("Git could not be found", `no git at ${CANDIDATES.join(", ")}`);

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
if (!status.ok)
  stopped("The submodules could not be read", "git submodule status failed");

const pinned = pinnedRevisions(status.out);
const branches = declaredBranches(
  git("config", "-f", ".gitmodules", "--get-regexp", String.raw`^submodule\.`)
    .out,
);
const reads = watched(GUARDED, [...pinned.keys()]);

// A guard whose source resolves to no pinned repository is a guard this check
// is not watching, and an empty list would read as a clean run.
if (reads.length === 0)
  stopped(
    "No guarded source sits in a pinned repository",
    "every guarded path resolved outside vendor/, so nothing was compared",
  );

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

const scanned = `${String(reads.length)} guarded paths, in ${String(fetched.size)} pinned repositories.`;

if (behind.length > 0) {
  say("## A guard is reading a source its pin has gone behind on");
  say();
  say(
    "**This check reports; it gates nothing.** A pin that lags is the design",
  );
  say(
    "(ADR-0015, REPO-R46) and there is no window here: what is reported is not",
  );
  say(
    "how far behind a pin is but what it is behind *on*. These commits touched",
  );
  say(
    "a file a guard in this repository holds a page to, so the guard can agree",
  );
  say(
    "with the vendored copy in both directions while the page is out of date.",
  );
  say("It does not mean this check is broken, and it is not failing any pull");
  say("request.");
} else if (unreadable.length > 0) {
  say("## A pinned repository could not be compared with its default branch");
  say();
  say(
    "**This check reports; it gates nothing.** This is not a pin that has gone",
  );
  say(
    "behind, and it is not news about the repository it names: the comparison",
  );
  say(
    "did not happen, so what that pin has taken is unknown rather than current.",
  );
} else {
  say("## Every pin has taken every commit touching a source a guard reads");
  say();
  say("A pin behind is the design (ADR-0015, REPO-R46). What is asked here is");
  say("narrower: whether any of the commits it has not taken touched a file a");
  say("guard in this repository holds a page to. None had.");
}

say();
say(scanned);

if (behind.length > 0) {
  say();
  say("Gone behind on a guarded source:");
  say();
  fenced(report(behind).split("\n"));
  say();
  say("To catch up: `git submodule update --remote <path>`, then re-run");
  say("`npm run guard`.");
  console.error(
    "::error::a guard is reading a source its pin has gone behind on, so the guard " +
      "can be green and the page wrong — this check reports it and gates nothing",
  );
}

if (unreadable.length > 0) {
  say();
  say("Could not be compared:");
  say();
  fenced(unreadable);
  console.error(
    "::error::a pinned repository could not be compared with its default branch, so " +
      "what it holds is unknown rather than current — this check reports it and gates " +
      "nothing",
  );
}

process.exit(behind.length + unreadable.length === 0 ? 0 : 1);

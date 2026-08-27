/**
 * The pinned sources a guard reads, and what a pin has not taken.
 *
 * A recount is only as true as the tree it recounts. `inventories.ts` and
 * `codes.ts` each name a file inside a submodule and hold this site's prose to
 * it; a pin sitting before a commit that touched one of those files leaves the
 * guard green and the page wrong. `pins.yml` asks how long a pin has been
 * behind, which is a different question with a different answer: a pin two days
 * behind is inside every window and still enough.
 *
 * Everything here is a pure function over text. Reading the checkout and its
 * remotes is `scripts/pins.ts`.
 */

import { ARTEFACT } from "./codes.ts";
import { INVENTORIES } from "./inventories.ts";
import { captured } from "./mirror.ts";

const VENDOR = "vendor/";
const TAB = "\t";

/** The branch a submodule that declares none of its own is read against. */
export const DEFAULT_BRANCH = "main";

/** What `git submodule status` puts in front of a revision it holds. */
const PINNED = /^[-+U ]?([0-9a-f]{40})\s+(\S+)/;
/** One `submodule.<name>.<key> <value>` line of `.gitmodules`. */
const DECLARED = /^submodule\.(.+)\.(path|branch)\s+(\S+)$/;
/** One line of `git log --format=%h%x09%cs%x09%s`. */
const LOGGED = new RegExp(String.raw`^(\S+)${TAB}(\S+)${TAB}(.*)$`);

/** A pinned repository, and a path inside it that a guard reads. */
export interface Watched {
  /** Where the submodule sits in this repository, such as `vendor/spec`. */
  readonly module: string;
  /** The path within it. Empty where the whole tree is the source. */
  readonly path: string;
}

/** A commit a pin has not taken. */
export interface Commit {
  readonly sha: string;
  readonly date: string;
  readonly subject: string;
}

/** One watched path, and the commits touching it that its pin has not taken. */
export interface Behind extends Watched {
  /** The revision the module is held at, as the notice names it. */
  readonly pin: string;
  readonly commits: readonly Commit[];
}

/**
 * Every path a guard in this repository reads to hold a page to.
 *
 * Taken from the declarations themselves rather than listed again here: an
 * inventory names the tree its members come from, and the error-code guard
 * names the artefact it holds the reference page to. A path outside `vendor/`
 * is one this repository owns and no pin stands in front of.
 */
export const GUARDED: readonly string[] = [
  ...new Set([ARTEFACT, ...INVENTORIES.map((one) => one.source)]),
].sort((a, b) => a.localeCompare(b));

/**
 * Each guarded path against the submodule holding it, in path order.
 *
 * The longest declared module wins, so a submodule nested inside another owns
 * the files under it. A path no module holds is this repository's own.
 */
export function watched(
  paths: readonly string[],
  modules: readonly string[],
): Watched[] {
  const longest = [...modules].sort((a, b) => b.length - a.length);
  const found: Watched[] = [];

  for (const path of [...paths].sort((a, b) => a.localeCompare(b))) {
    if (!path.startsWith(VENDOR)) continue;
    const module = longest.find(
      (one) => path === one || path.startsWith(`${one}/`),
    );
    if (module === undefined) continue;
    found.push({ module, path: path.slice(module.length + 1) });
  }

  return found;
}

/**
 * The pinned repositories no guard reads a path inside.
 *
 * `watched` answers which paths are read; this answers what that leaves out,
 * which is the half a reader cannot infer from a clean run. A repository no
 * guard reads a path inside contributes nothing to the comparison and so can
 * never appear in it — the run then says every pin has taken every commit
 * touching a guarded source, which is true, and reads as an account of all of
 * them.
 *
 * Named rather than counted, because "four of nine" invites the reader to guess
 * which five, and which five it is decides whether the silence matters.
 */
export function unread(
  paths: readonly string[],
  modules: readonly string[],
): string[] {
  const reading = new Set(watched(paths, modules).map((one) => one.module));
  return [...modules]
    .filter((one) => !reading.has(one))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * The revision each submodule is pinned to, by the path it sits at.
 *
 * What `git submodule status` prints.
 */
export function pinnedRevisions(status: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const line of status.split("\n")) {
    const one = PINNED.exec(line);
    if (one !== null) found.set(captured(one, 2), captured(one, 1));
  }
  return found;
}

/**
 * The default branch each submodule declares, by the path it sits at.
 *
 * What `git config -f .gitmodules --get-regexp ^submodule\.` prints. Every
 * submodule in this repository declares one.
 */
export function declaredBranches(config: string): Map<string, string> {
  const paths = new Map<string, string>();
  const branches = new Map<string, string>();

  for (const line of config.split("\n")) {
    const one = DECLARED.exec(line.trim());
    if (one === null) continue;
    const value = captured(one, 3);
    if (captured(one, 2) === "path") paths.set(captured(one, 1), value);
    else branches.set(captured(one, 1), value);
  }

  const found = new Map<string, string>();
  for (const [name, path] of paths)
    found.set(path, branches.get(name) ?? DEFAULT_BRANCH);
  return found;
}

/** The commits `git log --format=%h%x09%cs%x09%s` named. */
export function parseCommits(output: string): Commit[] {
  const found: Commit[] = [];
  for (const line of output.split("\n")) {
    const one = LOGGED.exec(line);
    if (one !== null)
      found.push({
        sha: captured(one, 1),
        date: captured(one, 2),
        subject: captured(one, 3),
      });
  }
  return found;
}

/**
 * The notice, naming every commit a pin has not taken.
 *
 * Named rather than counted: how far a pin is behind overall says nothing
 * about this site, since most of what a repository commits touches nothing a
 * guard here reads. One heading per module, so the entries arrive grouped by
 * module, which is the order `watched` returns them in.
 */
export function report(behind: readonly Behind[]): string {
  const lines: string[] = [];
  let module = "";

  for (const one of behind) {
    if (one.module !== module) {
      module = one.module;
      lines.push(`${module} is pinned at ${one.pin}`);
    }
    lines.push(`  ${one.path === "" ? "the whole tree" : one.path}`);
    for (const commit of one.commits)
      lines.push(`    ${commit.sha} ${commit.date} ${commit.subject}`);
  }

  return lines.join("\n");
}

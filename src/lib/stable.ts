/**
 * The revisions the stable documentation renders, and the rule that decides them.
 *
 * `next` is the submodule pins. The stable set, `pins/stable.toml`, is what the
 * newest released version recorded (REPO-R88):
 *
 * - the core at the tag it was released as;
 * - an embedded repository at the commit the version's manifest names under
 *   `pins`;
 * - every other repository at its default branch's last commit on or before the
 *   version's `released_on`, which git answers for a release that recorded
 *   nothing about it.
 *
 * Pure functions over text. `scripts/stable.ts` asks git and writes the file.
 */
import { parse } from "smol-toml";

/** Where the stable set is kept. */
export const STABLE = "pins/stable.toml";

/** Where the specification keeps one manifest per version. */
export const MANIFESTS = "70-operations/versions";

/** The first minor the site keeps (D22): the first release with plugins. */
export const FIRST_KEPT = "0.16";

/** The repository whose tag is the release. */
export const CORE = "lemonfiber";

/** A released version, as its manifest records it. */
export interface Release {
  readonly version: string;
  /** `YYYY-MM-DD`, in UTC. */
  readonly releasedOn: string;
  /** The tag the version shipped under. */
  readonly tag: string;
  /** The commits the release embedded, by repository. */
  readonly pins: Readonly<Record<string, string>>;
}

/** Where one repository's stable pin comes from. */
export type Source =
  | { readonly kind: "tag"; readonly tag: string }
  | { readonly kind: "manifest"; readonly commit: string }
  | { readonly kind: "day"; readonly day: string };

/** The stable set, as the file holds it. */
export interface Stable {
  readonly version: string;
  /** Commit by submodule path. */
  readonly pins: Readonly<Record<string, string>>;
  /**
   * The submodules with no commit on or before the release day: repositories
   * that did not exist yet, and whose pages that version does not have.
   */
  readonly absent: readonly string[];
}

/**
 * What the rule gives one submodule: a commit, nothing because the repository
 * had no commit by then, or nothing because git could not say.
 */
export type Expected =
  | { readonly kind: "commit"; readonly commit: string }
  | { readonly kind: "absent" }
  | { readonly kind: "unread" };

/** One way the stable set disagrees with the rule. */
export interface Fault {
  readonly module: string | null;
  readonly message: string;
}

const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const parsed = (text: string): Record<string, unknown> | null => {
  try {
    return record(parse(text));
  } catch {
    return null;
  }
};

/*
 * What a value read from a file must look like before it goes anywhere near
 * git. Every one of them reaches a command line, and git reads an argument that
 * starts with `-` as an option wherever it stands, so a pin of
 * `--upload-pack=<command>` would run that command. Nothing that fails these is
 * kept.
 */

/** A full commit id. */
export const COMMIT = /^[0-9a-f]{40}$/;

/** A version, as a manifest names one. */
const VERSION = /^\d+\.\d+\.\d+$/;

/** A release tag. */
const TAG = /^v\d+\.\d+\.\d+$/;

/** A release day, `YYYY-MM-DD`. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A manifest's release, or null for one that is not released, not readable, or
 * holding a version, a day, a tag or an embedded commit that is not one.
 */
export function releaseOf(manifest: string): Release | null {
  const read = parsed(manifest);
  if (read === null) return null;
  const { version, status, released_on: releasedOn } = read;
  const releasedAs = read["released_as"] ?? `v${String(version)}`;
  const pins = Object.entries(record(read["pins"]) ?? {});
  if (
    status !== "released" ||
    typeof version !== "string" ||
    !VERSION.test(version) ||
    typeof releasedOn !== "string" ||
    !DAY.test(releasedOn) ||
    typeof releasedAs !== "string" ||
    !TAG.test(releasedAs) ||
    !pins.every(
      ([, commit]) => typeof commit === "string" && COMMIT.test(commit),
    )
  )
    return null;
  return {
    version,
    releasedOn,
    tag: releasedAs,
    pins: Object.fromEntries(pins) as Record<string, string>,
  };
}

/** Every submodule `.gitmodules` declares, by the path it sits at. */
export function modulesIn(gitmodules: string): Set<string> {
  const found = new Set<string>();
  for (const line of gitmodules.split("\n")) {
    const [key = "", value] = line.split("=", 2);
    if (key.trim() === "path" && value !== undefined) found.add(value.trim());
  }
  return found;
}

/** `0.16` for `0.16.0`. */
export const minorOf = (version: string): string =>
  version.split(".").slice(0, 2).join(".");

const parts = (version: string): number[] =>
  version.split(".").map((part) => Number.parseInt(part, 10));

/** Semver order, by number rather than by text. */
export function byVersion(a: string, b: string): number {
  const [left, right] = [parts(a), parts(b)];
  for (let at = 0; at < Math.max(left.length, right.length); at += 1) {
    const difference = (left[at] ?? 0) - (right[at] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * When a release's pins stop moving: the end of its release day, in UTC, after
 * which no commit can join the ones on or before it. Seconds since the epoch.
 */
export const settledAt = (release: Release): number =>
  Date.parse(`${release.releasedOn}T00:00:00Z`) / 1000 + 24 * 3600;

/** Every released version the site keeps, oldest first (REPO-R89). */
export const keptReleases = (releases: readonly Release[]): Release[] =>
  releases
    .filter((one) => byVersion(minorOf(one.version), FIRST_KEPT) >= 0)
    .toSorted((a, b) => byVersion(a.version, b.version));

/** Where `repository`'s stable pin comes from in `release`. */
export function sourceOf(repository: string, release: Release): Source {
  if (repository === CORE) return { kind: "tag", tag: release.tag };
  const commit = release.pins[repository];
  if (commit !== undefined) return { kind: "manifest", commit };
  return { kind: "day", day: release.releasedOn };
}

/** What a source says, as the file's comment beside the pin. */
export function describe(source: Source): string {
  switch (source.kind) {
    case "tag":
      return `tag ${source.tag}`;
    case "manifest":
      return "the manifest's pins";
    case "day":
      return `default branch on or before ${source.day}`;
  }
}

/**
 * The stable set the rule gives `version`, and the submodules git could not
 * answer for, which leave the set unwritable.
 */
export function stableOf(
  version: string,
  rules: ReadonlyMap<string, Expected>,
): { stable: Stable; unread: string[] } {
  const pins: Record<string, string> = {};
  const absent: string[] = [];
  const unread: string[] = [];
  for (const [module, rule] of rules)
    if (rule.kind === "commit") pins[module] = rule.commit;
    else if (rule.kind === "absent") absent.push(module);
    else unread.push(module);
  return {
    stable: {
      version,
      pins,
      absent: absent.toSorted((a, b) => a.localeCompare(b)),
    },
    unread,
  };
}

/** A mirror, as much of one as deciding whether a version has it reads. */
export interface Declared {
  readonly repo: string;
  readonly path: string;
}

/**
 * The mirrors a build renders. A build from the submodule pins renders every
 * one. A versioned build renders none from a repository the release had no
 * commit of, and none whose source the pinned revision does not hold: a page
 * added after the release is a page that version does not have. `holds` says
 * whether a path exists in the checkout.
 */
export function renderedIn<T extends Declared>(
  mirrors: readonly T[],
  stable: Stable | null,
  holds: (path: string) => boolean,
): T[] {
  if (stable === null) return [...mirrors];
  const absent = new Set(stable.absent);
  return mirrors.filter((mirror) => {
    const module = `vendor/${mirror.repo}`;
    return (
      !absent.has(module) &&
      holds(mirror.path === "" ? module : `${module}/${mirror.path}`)
    );
  });
}

/**
 * The stable set in the file, and every entry in it that is refused rather than
 * kept: a pin that is not a full commit id, and a pin or an absent entry naming
 * a path that is not one of `modules`. Null where the file holds no set.
 */
export function parseStable(
  text: string,
  modules: ReadonlySet<string>,
): { stable: Stable; faults: Fault[] } | null {
  const read = parsed(text);
  const version = read?.["version"];
  if (read === null || typeof version !== "string" || !VERSION.test(version))
    return null;
  const faults: Fault[] = [];
  const pins: Record<string, string> = {};
  for (const [module, commit] of Object.entries(record(read["pins"]) ?? {}))
    if (!modules.has(module))
      faults.push({
        module: null,
        message: "a pin names no declared submodule",
      });
    else if (typeof commit !== "string" || !COMMIT.test(commit))
      faults.push({
        module,
        message: "pinned at something that is not a commit",
      });
    else pins[module] = commit;
  const listed = read["absent"];
  const absent: string[] = [];
  for (const one of Array.isArray(listed) ? listed : [])
    if (typeof one === "string" && modules.has(one)) absent.push(one);
    else
      faults.push({
        module: null,
        message: "an absent entry names no declared submodule",
      });
  return { stable: { version, pins, absent }, faults };
}

/** The file for `stable`, each pin with where it came from beside it. */
export function renderStable(
  stable: Stable,
  sources: Readonly<Record<string, Source>>,
): string {
  const lines = Object.entries(stable.pins)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([module, commit]) => {
      const source = sources[module];
      const said = source === undefined ? "" : `  # ${describe(source)}`;
      return `"${module}" = "${commit}"${said}`;
    });
  const absent =
    stable.absent.length === 0
      ? []
      : [
          "# No commit on or before the release day: these pages are not in this version.",
          `absent = [${stable.absent.map((one) => JSON.stringify(one)).join(", ")}]`,
        ];
  return [
    `# The revisions the stable documentation renders: what ${stable.version} recorded`,
    "# (REPO-R88). Written by `node scripts/stable.ts write`; `check` refuses any other.",
    `version = "${stable.version}"`,
    ...absent,
    "",
    "[pins]",
    ...lines,
    "",
  ].join("\n");
}

/** How one submodule's entry disagrees with what the rule gives, or null. */
function moduleFault(
  stable: Stable,
  module: string,
  rule: Expected,
): string | null {
  const pinned = stable.pins[module];
  const absent = stable.absent.includes(module);
  switch (rule.kind) {
    case "unread":
      return "the rule's commit could not be read";
    case "absent":
      return absent
        ? null
        : `has no commit on or before the release day, so ${stable.version} does not have it`;
    case "commit":
      if (absent) return `called absent, and the rule gives ${rule.commit}`;
      if (pinned === undefined)
        return `no stable pin; the rule gives ${rule.commit}`;
      return pinned === rule.commit
        ? null
        : `pinned at ${pinned}, and ${stable.version} recorded ${rule.commit}`;
  }
}

/**
 * Every way `stable` disagrees with what the rule gives.
 *
 * `expected` is the commit the rule gives each submodule, or null where git
 * could not say. `newest` is the newest kept release; the file may lag it for
 * `window` seconds once its pins have settled, the time the version workflow
 * has to move it.
 */
export function stableFaults(
  stable: Stable,
  expected: ReadonlyMap<string, Expected>,
  newest: Release | null,
  now: number,
  window: number,
): Fault[] {
  const found: Fault[] = [];
  for (const [module, rule] of expected) {
    const message = moduleFault(stable, module, rule);
    if (message !== null) found.push({ module, message });
  }
  for (const module of [...Object.keys(stable.pins), ...stable.absent])
    if (!expected.has(module))
      found.push({ module, message: "pinned, and no submodule sits there" });

  if (newest !== null && byVersion(newest.version, stable.version) > 0) {
    if (now - settledAt(newest) > window)
      found.push({
        module: null,
        message: `renders ${stable.version}, and ${newest.version} was released on ${newest.releasedOn}`,
      });
  }
  return found;
}

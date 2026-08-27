/**
 * Reading a set of members out of the tree it is declared in.
 *
 * `inventories.ts` names, for each set this site states a number about, the
 * tree the members come from and how to read them out of it. This is the
 * reading: one function per shape a source declares its members in, knowing
 * nothing of which sets there are, of this site's pages, or of what a
 * violation is.
 *
 * Pure functions over text.
 */

import { matches } from "./counts.ts";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "./mirror.ts";

/** The `id` of every `[[table]]` the stack manifest declares. */
export const ids = (stack: string, table: string): string[] =>
  matches(
    new RegExp(String.raw`^\[\[${table}\]\]\nid = "([^"]+)"`, "gm"),
    stack,
  );

/** Each service's display name, which is how the pages write them. */
export const serviceNames = (stack: string): string[] =>
  matches(/^\[\[service\]\]\nid = "[^"]+"\nname = "([^"]+)"/gm, stack);

const parsed = (json: string): unknown => {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
};

/** Whatever a path through a JSON document leads to. */
const nodeAt = (json: string, path: readonly string[]): unknown => {
  let here: unknown = parsed(json);
  for (const step of path) {
    if (typeof here !== "object" || here === null) return null;
    here = (here as Record<string, unknown>)[step];
  }
  return here;
};

/** The keys of the object at `path`, or none where the path does not lead. */
export function keysAt(json: string, ...path: readonly string[]): string[] {
  const here = nodeAt(json, path);
  return typeof here === "object" && here !== null ? Object.keys(here) : [];
}

/** The first string constant anywhere inside a schema branch. */
const constIn = (node: unknown): string | null => {
  if (typeof node !== "object" || node === null) return null;
  const here = node as Record<string, unknown>;
  const value = here["const"];
  if (typeof value === "string") return value;
  for (const child of Object.values(here)) {
    const found = constIn(child);
    if (found !== null) return found;
  }
  return null;
};

/**
 * Every variant the `oneOf` at `path` names.
 *
 * A variant names itself with a constant: at the top of the branch where it
 * carries nothing, and under the field that discriminates it where it does.
 */
export function variantsAt(json: string, ...path: readonly string[]): string[] {
  const node = nodeAt(json, path);
  if (typeof node !== "object" || node === null) return [];
  const branches = (node as { oneOf?: unknown }).oneOf;
  if (!Array.isArray(branches)) return [];

  const found: string[] = [];
  for (const branch of branches) {
    const name = constIn(branch);
    if (name !== null) found.push(name);
  }
  return found;
}

/** The section of a markdown document under a second-level heading. */
const section = (text: string, heading: string): string => {
  const start = text.indexOf(`\n## ${heading}\n`);
  if (start === -1) return "";
  const next = text.indexOf("\n## ", start + 1);
  return next === -1 ? text.slice(start) : text.slice(start, next);
};

/** The generated reference's first section: `lemonfiber` itself. */
const topLevel = (commands: string): string =>
  section(commands, "`lemonfiber`");

/** Every subcommand the binary declares, clap's own `help` among them. */
export const subcommands = (commands: string): string[] => {
  const block = /^Commands:\n((?:[ \t]+\S.*\n)+)/m.exec(topLevel(commands));
  return block === null
    ? []
    : matches(/^[ \t]+([a-z][a-z-]*)/gm, captured(block, 1));
};

/**
 * The flags declared on `lemonfiber` itself and inherited by every subcommand.
 *
 * Less `--help` and `--version`: clap gives those to every binary, and the page
 * says as much in prose rather than listing them as flags of ours.
 */
export const globalFlags = (commands: string): string[] => {
  const block = /^Options:\n([\s\S]+)$/m.exec(topLevel(commands));
  if (block === null) return [];
  return matches(/^[ \t]+(?:-\w, )?(--[a-z-]+)/gm, captured(block, 1)).filter(
    (flag) => flag !== "--help" && flag !== "--version",
  );
};

/** The presets `lemonfiber quality set` names in its own argument help. */
export const presets = (commands: string): string[] => {
  const said = /^ *The preset: (.+)$/m.exec(commands);
  return said === null
    ? []
    : captured(said, 1)
        .split(",")
        .flatMap((one) => one.split(" or "))
        .map((one) => one.trim())
        .filter((one) => one.length > 0);
};

/** The endpoints the web-API contract sets out under reading, not streaming. */
export const readEndpoints = (webApi: string): string[] =>
  matches(/GET \/api\/([a-z]+)/g, section(webApi, "Reading"));

const FEATURE =
  /^vendor\/spec\/10-functional\/features\/[a-z]-[a-z-]+\/[a-z]\d+-[a-z0-9-]+\.md$/;
const JOURNEY = /^vendor\/spec\/10-functional\/journeys\/j\d+-[a-z0-9-]+\.md$/;
const DECISION = /^vendor\/spec\/00-overview\/decisions\/\d{4}-[a-z0-9-]+\.md$/;
const CONTRACT_SHAPE =
  /^vendor\/spec\/20-architecture\/contracts\/[a-z0-9-]+\.md$/;
const SECTION = /^vendor\/spec\/(\d\d-[a-z]+)\//;

const specFiles = (paths: readonly string[], shape: RegExp): string[] =>
  paths.filter((path) => shape.test(path));

/** The numbered top-level directories the specification is divided into. */
export const specSections = (paths: readonly string[]): string[] => {
  const found = new Set<string>();
  for (const path of paths) {
    const match = SECTION.exec(path);
    if (match !== null) found.add(captured(match, 1));
  }
  return [...found];
};

/** One `export { … } from "…";` of a package's entry point. */
const RE_EXPORTED = /export\s*\{([^}]*)\}\s*from\s*"[^"]*";/g;

/** A leading `type`, which says how a name is exported rather than which name. */
const AS_A_TYPE = /^type\s+/;

/**
 * Every name the client package's entry point puts on its public surface.
 *
 * Read from the entry point rather than from the modules behind it: what a
 * package exports is what its entry point re-exports, and a name a module
 * exports and the entry point does not is not something a consumer can reach.
 * A type and a value are one list here, because the page lists them as one.
 */
export function exportedBy(index: string): string[] {
  const found = new Set<string>();
  for (const block of index.matchAll(RE_EXPORTED))
    for (const one of captured(block, 1).split(","))
      found.add(one.trim().replace(AS_A_TYPE, ""));
  found.delete("");
  return [...found];
}

/** The scope every package this org publishes carries. */
const SCOPE = /^@lemonfiber\//;

/**
 * The repositories a manifest depends on at run time.
 *
 * Named as repositories rather than as packages, which is how the map of the
 * org writes them. A dependency from outside the org keeps the name it has and
 * so is reported rather than passed over.
 */
export const consumes = (manifest: string): string[] =>
  keysAt(manifest, "dependencies").map((name) => name.replace(SCOPE, ""));

/** Every repository this site renders, each counted once however many mirrors. */
export const mirrored = (manifest: string): string[] => {
  const read = parsed(manifest);
  if (typeof read !== "object" || read === null) return [];
  const declared = (read as { mirrors?: unknown }).mirrors;
  if (!Array.isArray(declared)) return [];
  return [
    ...new Set(declared.map((one) => String((one as { repo?: unknown }).repo))),
  ];
};

/** Every feature the specification sets out, one file each. */
export const features = (paths: readonly string[]): string[] =>
  specFiles(paths, FEATURE);

/** Every end-to-end journey it sets out. */
export const journeys = (paths: readonly string[]): string[] =>
  specFiles(paths, JOURNEY);

/** Every architecture decision record it holds. */
export const decisions = (paths: readonly string[]): string[] =>
  specFiles(paths, DECISION);

/** Every normative contract it holds. */
export const contracts = (paths: readonly string[]): string[] =>
  specFiles(paths, CONTRACT_SHAPE);

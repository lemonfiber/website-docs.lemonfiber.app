/**
 * What this site counts, and where each count is derived from.
 *
 * One entry per set of things the prose states a number about. No entry states
 * the number: it names the tree the members are declared in, how to read them
 * out of it, and the sentence shapes that state how many there are. The
 * mechanism is `src/lib/counts.ts`.
 *
 * A number stated here that no vendored tree declares is not in this table.
 * Those are named in the README, under what stays unchecked.
 */

import { matches, type Inventory, type Page, type Sources } from "./counts.ts";
import { captured } from "./mirror.ts";
import { columnUnder, firstColumnUnder, namesUnder } from "./tables.ts";

const STACK = "vendor/lemonfiber-media-stack/stack.toml";
const CONTRACT = "vendor/lemonfiber/contract/web-api.contract.json";
const COMMANDS = "vendor/lemonfiber/reference/commands.md";
const WEB_API = "vendor/spec/20-architecture/contracts/web-api.md";
const MIRRORS = "mirrors.json";
const CLIENT_INDEX = "vendor/sdk-ts/src/index.ts";
const SPEC = "vendor/spec";

const DOCS = "src/content/docs/";
const ENVELOPE_PAGE = `${DOCS}api/the-envelope.md`;
const KINDS_PAGE = `${DOCS}api/kinds.md`;
const TUI_PAGE = `${DOCS}commands/the-tui.md`;
const CODES_PAGE = `${DOCS}fixing/every-error-by-code.md`;
const CLIENT_PAGE = `${DOCS}api/typescript-sdk.md`;

/** One page's prose, or none when the page is not in the tree. */
const prose = (pages: readonly Page[], path: string): string =>
  pages.find((page) => page.path === path)?.text ?? "";

/** The `id` of every `[[table]]` the stack manifest declares. */
const ids = (stack: string, table: string): string[] =>
  matches(
    new RegExp(String.raw`^\[\[${table}\]\]\nid = "([^"]+)"`, "gm"),
    stack,
  );

/** Each service's display name, which is how the pages write them. */
const serviceNames = (stack: string): string[] =>
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
const subcommands = (commands: string): string[] => {
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
const globalFlags = (commands: string): string[] => {
  const block = /^Options:\n([\s\S]+)$/m.exec(topLevel(commands));
  if (block === null) return [];
  return matches(/^[ \t]+(?:-\w, )?(--[a-z-]+)/gm, captured(block, 1)).filter(
    (flag) => flag !== "--help" && flag !== "--version",
  );
};

/** The presets `lemonfiber quality set` names in its own argument help. */
const presets = (commands: string): string[] => {
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
const readEndpoints = (webApi: string): string[] =>
  matches(/GET \/api\/([a-z]+)/g, section(webApi, "Reading"));

/** The endpoints a page sets out one per row, named the way the contract names them. */
const endpointsListed = (text: string): string[] =>
  matches(/^GET \/api\/([a-z]+)/gm, columnUnder(text, "Endpoint").join("\n"));

const FEATURE =
  /^vendor\/spec\/10-functional\/features\/[a-z]-[a-z-]+\/[a-z]\d+-[a-z0-9-]+\.md$/;
const JOURNEY = /^vendor\/spec\/10-functional\/journeys\/j\d+-[a-z0-9-]+\.md$/;
const DECISION = /^vendor\/spec\/00-overview\/decisions\/\d{4}-[a-z0-9-]+\.md$/;
const CONTRACT_PAGE =
  /^vendor\/spec\/20-architecture\/contracts\/[a-z0-9-]+\.md$/;
const SECTION = /^vendor\/spec\/(\d\d-[a-z]+)\//;

const specFiles = (paths: readonly string[], shape: RegExp): string[] =>
  paths.filter((path) => shape.test(path));

/** The numbered top-level directories the specification is divided into. */
const specSections = (paths: readonly string[]): string[] => {
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

/** Every repository this site renders, each counted once however many mirrors. */
const mirrored = (manifest: string): string[] => {
  const read = parsed(manifest);
  if (typeof read !== "object" || read === null) return [];
  const declared = (read as { mirrors?: unknown }).mirrors;
  if (!Array.isArray(declared)) return [];
  return [
    ...new Set(declared.map((one) => String((one as { repo?: unknown }).repo))),
  ];
};

/** The payload kinds `api/kinds.md` sets out field by field, as its headings. */
const expandedKinds = (sources: Sources, pages: readonly Page[]): string[] => {
  const declared = new Set(keysAt(sources.contract, "kinds"));
  return matches(/^## `([a-z]+)`$/gm, prose(pages, KINDS_PAGE)).filter((kind) =>
    declared.has(kind),
  );
};

export const INVENTORIES: readonly Inventory[] = [
  {
    what: "services",
    source: STACK,
    members: (sources) => ids(sources.stack, "service"),
    claims: [
      { says: "all %N% services" },
      { says: "the %N% services" },
      { says: "is %N% services" },
      { says: "across %N% services" },
      { says: String.raw`/running/the-services/\) — what each of the %N%` },
      { says: "all %N% are open source" },
      { says: "making the list %N%", plus: 1 },
    ],
  },
  {
    what: "profiles",
    source: STACK,
    members: (sources) => ids(sources.stack, "profile"),
    claims: [{ says: "the %N% profiles" }],
    listing: {
      page: `${DOCS}running/forms-and-slices.md`,
      members: (text) => columnUnder(text, "Profile"),
    },
  },
  {
    what: "forms",
    source: STACK,
    members: (sources) => ids(sources.stack, "form"),
    claims: [{ says: "the %N% forms" }],
    listing: {
      page: `${DOCS}running/forms-and-slices.md`,
      members: (text) => columnUnder(text, "Form"),
    },
  },
  {
    what: "service names",
    source: STACK,
    members: (sources) => serviceNames(sources.stack),
    claims: [],
    listing: {
      page: `${DOCS}running/the-services.md`,
      members: (text) => columnUnder(text, "Service"),
    },
  },
  {
    what: "payload kinds",
    source: CONTRACT,
    members: (sources) => keysAt(sources.contract, "kinds"),
    claims: [
      { says: "%N% payload kinds" },
      { says: String.raw`artefact describes\s+%N%` },
    ],
    listing: {
      page: KINDS_PAGE,
      members: (text) => columnUnder(text, "Kind"),
    },
  },
  {
    what: "payload kinds set out field by field",
    source: KINDS_PAGE,
    members: expandedKinds,
    claims: [
      { says: "%N% of them are set out" },
      { says: "the %N% most-used ones" },
      { says: "the %N% documented field by field" },
    ],
  },
  {
    what: "payload kinds left to the artefact",
    source: CONTRACT,
    members: (sources, pages) => {
      const expanded = new Set(expandedKinds(sources, pages));
      return keysAt(sources.contract, "kinds").filter(
        (kind) => !expanded.has(kind),
      );
    },
    claims: [{ says: "the other %N%$" }, { says: "the %N% not expanded" }],
  },
  {
    what: "panels in a dashboard payload",
    source: CONTRACT,
    members: (sources) =>
      keysAt(
        sources.contract,
        "kinds",
        "dashboard",
        "$defs",
        "Snapshot",
        "properties",
      ),
    claims: [{ says: "carries %N% panels" }],
  },
  {
    what: "fields in a lifecycle report",
    source: CONTRACT,
    members: (sources) =>
      keysAt(
        sources.contract,
        "kinds",
        "lifecycle",
        "$defs",
        "LifecycleReport",
        "properties",
      ),
    claims: [{ says: "carries %N% fields" }],
  },
  {
    what: "diagnostic categories",
    source: CONTRACT,
    members: (sources) =>
      variantsAt(sources.contract, "kinds", "doctor", "$defs", "Category"),
    claims: [],
    listing: {
      page: `${DOCS}fixing/run-the-doctor.md`,
      members: (text) => columnUnder(text, "Category"),
    },
  },
  {
    what: "verdicts a check comes back as",
    source: CONTRACT,
    members: (sources) =>
      variantsAt(sources.contract, "kinds", "doctor", "$defs", "Verdict"),
    claims: [{ says: "comes back as one of %N%" }],
    listing: {
      page: `${DOCS}fixing/run-the-doctor.md`,
      members: (text) => columnUnder(text, "Verdict"),
    },
  },
  {
    what: "verdicts a whole run comes back as",
    source: CONTRACT,
    members: (sources) =>
      variantsAt(sources.contract, "kinds", "doctor", "$defs", "Overall"),
    claims: [{ says: "as a whole is then one of %N%" }],
    listing: {
      page: `${DOCS}fixing/run-the-doctor.md`,
      members: (text) => columnUnder(text, "Overall"),
    },
  },
  {
    what: "levels of severity",
    source: CONTRACT,
    members: (sources) =>
      variantsAt(sources.contract, "kinds", "error", "$defs", "Severity"),
    claims: [
      { says: "%N% levels, deliberately" },
      { says: "one of %N% levels" },
      { says: "there are %N% deliberately" },
    ],
    listing: {
      page: CODES_PAGE,
      members: (text) => columnUnder(text, "Severity"),
    },
  },
  {
    what: "states a problem stands in",
    source: CONTRACT,
    members: (sources) =>
      variantsAt(sources.contract, "kinds", "error", "$defs", "State"),
    claims: [],
    listing: {
      page: CODES_PAGE,
      members: (text) => columnUnder(text, "State"),
    },
  },
  {
    what: "read endpoints",
    source: WEB_API,
    members: (sources) => readEndpoints(sources.webApi),
    claims: [{ says: "%N% endpoints answer a question" }],
    listing: {
      page: ENVELOPE_PAGE,
      members: endpointsListed,
    },
  },
  {
    what: "subcommands",
    source: COMMANDS,
    members: (sources) => subcommands(sources.commands),
    claims: [],
    listing: {
      page: `${DOCS}commands/index.mdx`,
      members: (text) =>
        columnUnder(text, "Command").filter((name) => !name.includes(" ")),
    },
  },
  {
    what: "global flags",
    source: COMMANDS,
    members: (sources) => globalFlags(sources.commands),
    claims: [
      { says: String.raw`the (?:same )?%N% \[?global flags` },
      { says: "the %N% flags every" },
      { says: "^%N% flags are declared" },
    ],
    listing: {
      page: `${DOCS}commands/global-flags.md`,
      members: (text) =>
        firstColumnUnder(text, "Flag").map((cell) =>
          cell.split(" ", 1).join(""),
        ),
    },
  },
  {
    what: "quality presets",
    source: COMMANDS,
    members: (sources) => presets(sources.commands),
    claims: [{ says: "the %N% presets" }],
    listing: {
      page: `${DOCS}running/quality-presets.md`,
      members: (text) => columnUnder(text, "Preset"),
    },
  },
  {
    what: "features",
    source: SPEC,
    members: (sources) => specFiles(sources.spec, FEATURE),
    claims: [{ says: "%N% features and" }],
  },
  {
    what: "journeys",
    source: SPEC,
    members: (sources) => specFiles(sources.spec, JOURNEY),
    claims: [{ says: "%N% end-to-end journeys" }],
  },
  {
    what: "architecture decision records",
    source: SPEC,
    members: (sources) => specFiles(sources.spec, DECISION),
    claims: [{ says: "the %N% architecture decision records" }],
  },
  {
    what: "normative contracts",
    source: SPEC,
    members: (sources) => specFiles(sources.spec, CONTRACT_PAGE),
    claims: [{ says: "the %N% normative contracts" }],
  },
  {
    what: "sections of the specification",
    source: SPEC,
    members: (sources) => specSections(sources.spec),
    claims: [{ says: "the %N% sections" }],
  },
  {
    what: "exports the client package declares",
    source: CLIENT_INDEX,
    members: (sources) => exportedBy(sources.clientIndex),
    claims: [],
    listing: {
      page: CLIENT_PAGE,
      members: (text) => namesUnder(text, "Export"),
    },
  },
  {
    what: "repositories this site renders",
    source: MIRRORS,
    members: (sources) => mirrored(sources.mirrors),
    claims: [{ says: "%N% repositories feed this site" }],
  },
  {
    what: "panels on the dashboard screen",
    source: TUI_PAGE,
    members: (_sources, pages) => columnUnder(prose(pages, TUI_PAGE), "Panel"),
    claims: [{ says: "%N% panels, and a footer" }],
  },
  {
    what: "codes with no known remedy",
    source: CODES_PAGE,
    members: (_sources, pages) =>
      matches(
        /^\| `([A-Z][A-Z0-9]*-\d+)` \|(?=.*Nothing is known to fix this)/gm,
        prose(pages, CODES_PAGE),
      ),
    claims: [
      { says: "%N% codes on this page do that" },
      { says: "%N% codes elsewhere on the site" },
    ],
  },
];

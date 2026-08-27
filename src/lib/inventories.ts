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
import {
  composerSteps,
  consolePlaces,
  consumes,
  contracts,
  decisions,
  exportedBy,
  features,
  globalFlags,
  ids,
  journeys,
  keysAt,
  mirrored,
  presets,
  readEndpoints,
  serviceNames,
  specSections,
  subcommands,
  variantsAt,
} from "./sources.ts";
import { columnUnder, firstColumnUnder, namesUnder } from "./tables.ts";

const STACK = "vendor/lemonfiber-media-stack/stack.toml";
const CONTRACT = "vendor/lemonfiber/contract/web-api.contract.json";
const COMMANDS = "vendor/lemonfiber/reference/commands.md";
const WEB_API = "vendor/spec/20-architecture/contracts/web-api.md";
const MIRRORS = "mirrors.json";
const CLIENT_INDEX = "vendor/sdk-ts/src/index.ts";
const WEB_MANIFEST = "vendor/lemonfiber-web/package.json";
const WEB_ROUTE = "vendor/lemonfiber-web/src/lib/route.ts";
// Each client is generated from a copy of the contract taken when it was last
// re-synced, and the two copies are at different revisions. Held separately from
// the binary's for exactly that reason: a page that stated one number for all
// three would be wrong about two of them.
const PHP_MANIFEST = "vendor/sdk-php/composer.json";
const PHP_CONTRACT = "vendor/sdk-php/contract/web-api.contract.json";
const TS_CONTRACT = "vendor/sdk-ts/contract/web-api.contract.json";
const SPEC = "vendor/spec";

const DOCS = "src/content/docs/";
const ENVELOPE_PAGE = `${DOCS}api/the-envelope.md`;
const KINDS_PAGE = `${DOCS}api/kinds.md`;
const TUI_PAGE = `${DOCS}commands/the-tui.md`;
const CONSOLE_PAGE = `${DOCS}commands/the-web-console.md`;
const CODES_PAGE = `${DOCS}fixing/every-error-by-code.md`;
const CLIENT_PAGE = `${DOCS}api/typescript-sdk.md`;
const PHP_PAGE = `${DOCS}api/php-sdk.md`;
const REPO_MAP_PAGE = `${DOCS}develop/repo-map.md`;

/** One page's prose, or none when the page is not in the tree. */
const prose = (pages: readonly Page[], path: string): string =>
  pages.find((page) => page.path === path)?.text ?? "";

/** The endpoints a page sets out one per row, named the way the contract names them. */
const endpointsListed = (text: string): string[] =>
  matches(/^GET \/api\/([a-z]+)/gm, columnUnder(text, "Endpoint").join("\n"));

/** The repositories a page says the web surface consumes. */
const consumedByWeb = (text: string): string[] => {
  const said = /`lemonfiber-web` consumes ([^*]+)\*\*/.exec(text);
  return said === null ? [] : matches(/`([^`]+)`/g, captured(said, 1));
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
    what: "kinds the PHP client generates a class for",
    source: PHP_CONTRACT,
    members: (sources) => keysAt(sources.phpContract, "kinds"),
    claims: [{ says: "a class for each of %N%" }],
  },
  {
    what: "kinds the TypeScript client generates a type for",
    source: TS_CONTRACT,
    members: (sources) => keysAt(sources.tsContract, "kinds"),
    claims: [{ says: "types for %N% of them" }],
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
    members: (sources) => features(sources.spec),
    claims: [{ says: "%N% features and" }],
  },
  {
    what: "journeys",
    source: SPEC,
    members: (sources) => journeys(sources.spec),
    claims: [{ says: "%N% end-to-end journeys" }],
  },
  {
    what: "architecture decision records",
    source: SPEC,
    members: (sources) => decisions(sources.spec),
    claims: [{ says: "the %N% architecture decision records" }],
  },
  {
    what: "normative contracts",
    source: SPEC,
    members: (sources) => contracts(sources.spec),
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
    what: "repositories the web surface consumes",
    source: WEB_MANIFEST,
    members: (sources) => consumes(sources.webManifest),
    claims: [],
    listing: {
      page: REPO_MAP_PAGE,
      members: consumedByWeb,
    },
  },
  {
    what: "gates `composer ci` runs",
    source: PHP_MANIFEST,
    members: (sources) => composerSteps(sources.phpManifest, "ci"),
    claims: [{ says: "runs the %N% below" }],
    listing: {
      page: PHP_PAGE,
      members: (text) => columnUnder(text, "Gate"),
    },
  },
  {
    what: "screens the console has",
    source: WEB_ROUTE,
    members: (sources) => consolePlaces(sources.webRoute),
    claims: [{ says: "The %N% screens" }],
    listing: {
      page: CONSOLE_PAGE,
      // The page writes an address as code, and the root as `/`. What the
      // console calls that place is `overview`, which is the name the list it
      // is compared against holds.
      members: (text) =>
        columnUnder(text, "Address").map(
          (at) => at.replace("/", "") || "overview",
        ),
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

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

import { FAMILIES, INDEX, isFamilyPage } from "./codes.ts";
import { CONTRACT_DIRECTORY } from "./contract.ts";
import { matches, type Inventory, type Page, type Sources } from "./counts.ts";
import {
  consolePlaces,
  globalFlags,
  ids,
  keysAt,
  namesAt,
  offered,
  presets,
  readEndpoints,
  required,
  serviceNames,
  thirdParty,
  subcommands,
  variantsAt,
} from "./sources.ts";
import { columnUnder, firstColumnUnder } from "./tables.ts";

const STACK = "vendor/lemonfiber-media-stack/stack.toml";
const CONTRACT = CONTRACT_DIRECTORY;
const COMMANDS = "vendor/lemonfiber/reference/commands.md";
// The index links one page per command; a command's own arguments are on its page.
const QUALITY = "vendor/lemonfiber/reference/commands/quality.md";
const POINTS = "vendor/lemonfiber/contract/extension-points.json";
const VOCABULARY = "vendor/lemonfiber/contract/capability-vocabulary.json";
const WEB_API = "vendor/spec/20-architecture/contracts/web-api.md";
const WEB_ROUTE = "vendor/lemonfiber-web/src/lib/route.ts";

const DOCS = "src/content/docs/";
const ENVELOPE_PAGE = `${DOCS}api/the-envelope.md`;
const KINDS_PAGE = `${DOCS}api/kinds.md`;
const TUI_PAGE = `${DOCS}commands/the-tui.md`;
const CONSOLE_PAGE = `${DOCS}commands/the-web-console.md`;
const MANIFEST_PAGE = `${DOCS}plugins/the-manifest.mdx`;
const TEMPLATE = "vendor/plugin-template/plugin.toml";

/** The two sentences the manifest page holds the template to the build with. */
const TEMPLATE_REQUIRES = "Its `[requires]` names";
const BUILD_OFFERS = "The lemonfiber this site pins offers";
const NOTHING_ELSE = "and nothing else";

/**
 * Every name written as code between two phrases of a page, read with its line
 * breaks taken as spaces, since a sentence wraps where the line ends.
 */
export const namesBetween = (
  text: string,
  from: string,
  to: string,
): string[] => {
  const flat = text.replace(/\s+/g, " ");
  const start = flat.indexOf(from);
  if (start === -1) return [];
  const end = flat.indexOf(to, start + from.length);
  if (end === -1) return [];
  return matches(/`([^`]+)`/g, flat.slice(start + from.length, end));
};

/** One page's prose, or none when the page is not in the tree. */
const prose = (pages: readonly Page[], path: string): string =>
  pages.find((page) => page.path === path)?.text ?? "";

/** The endpoints a page sets out one per row, named the way the contract names them. */
const endpointsListed = (text: string): string[] =>
  matches(/^GET \/api\/([a-z]+)/gm, columnUnder(text, "Endpoint").join("\n"));

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
      { says: "making the list %N%", plus: 1 },
    ],
  },
  {
    what: "services taken from open source",
    source: STACK,
    members: (sources) => thirdParty(sources.stack),
    claims: [{ says: "%N% are open source" }],
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
      variantsAt(
        sources.contract,
        "kinds",
        "doctor",
        "$defs",
        "DoctorCategory",
      ),
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
      variantsAt(sources.contract, "kinds", "doctor", "$defs", "DoctorVerdict"),
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
      variantsAt(
        sources.contract,
        "kinds",
        "error",
        "$defs",
        "ProblemSeverity",
      ),
    claims: [
      { says: "%N% levels, deliberately" },
      { says: "one of %N% levels" },
      { says: "there are %N% deliberately" },
    ],
    listing: {
      page: INDEX,
      members: (text) => columnUnder(text, "Severity"),
    },
  },
  {
    what: "states a problem stands in",
    source: CONTRACT,
    members: (sources) =>
      variantsAt(sources.contract, "kinds", "error", "$defs", "ProblemState"),
    claims: [],
    listing: {
      page: INDEX,
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
    source: QUALITY,
    members: (sources) => presets(sources.quality),
    claims: [{ says: "the %N% presets" }],
    listing: {
      page: `${DOCS}running/quality-presets.md`,
      members: (text) => columnUnder(text, "Preset"),
    },
  },
  {
    what: "extension points",
    source: POINTS,
    members: (sources) => namesAt(sources.extensionPoints, "points"),
    claims: [{ says: "%N% extension points" }],
  },
  {
    what: "capabilities the plugin template requires",
    source: TEMPLATE,
    members: (sources) => required(sources.template),
    claims: [],
    listing: {
      page: MANIFEST_PAGE,
      members: (text) => namesBetween(text, TEMPLATE_REQUIRES, BUILD_OFFERS),
    },
  },
  {
    what: "capabilities this build offers a plugin",
    source: POINTS,
    members: (sources) => offered(sources.extensionPoints),
    claims: [],
    listing: {
      page: MANIFEST_PAGE,
      members: (text) => namesBetween(text, BUILD_OFFERS, NOTHING_ELSE),
    },
  },
  {
    what: "capabilities in the vocabulary",
    source: VOCABULARY,
    members: (sources) => namesAt(sources.vocabulary, "capabilities"),
    claims: [{ says: "%N% core capabilities" }],
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
    what: "panels on the dashboard screen",
    source: TUI_PAGE,
    members: (_sources, pages) => columnUnder(prose(pages, TUI_PAGE), "Panel"),
    claims: [{ says: "%N% panels, and a footer" }],
  },
  {
    what: "codes with no known remedy",
    source: FAMILIES,
    members: (_sources, pages) =>
      pages
        .filter(isFamilyPage)
        .flatMap((page) =>
          matches(
            /^\| `([A-Z][A-Z0-9]*-\d+)` \|(?=.*Nothing is known to fix this)/gm,
            page.text,
          ),
        ),
    claims: [
      { says: "%N% codes in this reference do that" },
      { says: "%N% codes elsewhere on the site" },
    ],
  },
];

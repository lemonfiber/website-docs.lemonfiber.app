/**
 * Each client's copy of the contract, against the one the binary serves.
 *
 * A client generates its types from a copy of `web-api.contract.json` taken
 * when it was last re-synced, and its page here says how that copy stands
 * against the artefact this site's pinned binary serves. `inventories.ts` holds
 * each page's count of kinds to its own copy, so a copy that has fallen behind
 * fails on the number. The sentence saying how the two stand is held by nothing
 * — and it went false: both pages called their copy older than the binary's for
 * as long as it was, and went on saying so after the two met.
 *
 * The comparison is the set of kinds rather than the bytes. That is what the
 * pages claim about — a class or a type for each kind — and a reworded
 * description upstream would otherwise flip the verdict and ask for a page
 * rewrite that says nothing new.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import type { Page } from "./counts.ts";
import type { Violation } from "./guards";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { keysAt } from "./sources.ts";

/** The artefact the binary this site pins serves. */
export const SERVED = "vendor/lemonfiber/contract/web-api.contract.json";

const DOCS = "src/content/docs/";

/** One client, where its copy of the contract sits, and the page about it. */
export interface Client {
  /** The client, as a violation names it. */
  readonly name: string;
  /** Its copy of the artefact, as a violation names it. */
  readonly source: string;
  /** The page stating how that copy stands against the served artefact. */
  readonly page: string;
}

export const CLIENTS: readonly Client[] = [
  {
    name: "the PHP client",
    source: "vendor/sdk-php/contract/web-api.contract.json",
    page: `${DOCS}api/php-sdk.md`,
  },
  {
    name: "the TypeScript client",
    source: "vendor/sdk-ts/contract/web-api.contract.json",
    page: `${DOCS}api/typescript-sdk.md`,
  },
];

/**
 * Every path this rule reads.
 *
 * Declared here so `pins.ts` watches each of them from the day the rule is
 * added, whether or not an inventory happens to name the same file.
 */
export const CONTRACTS: readonly string[] = [
  SERVED,
  ...CLIENTS.map((one) => one.source),
];

/** What a page says where its client's copy holds the kinds the binary serves. */
export const SAME = "carries the same kinds the binary this site pins serves";

/** What it says where the two sets differ. */
export const DIFFERS =
  "carries a different set of kinds from the one the binary this site pins serves";

/** One client's copy of the artefact, already read. */
export interface Copy extends Client {
  readonly text: string;
}

/** Which of the two closed shapes a page states, or that it states neither. */
export type Said = "same" | "differs" | "neither" | "both";

const at = (where: string, message: string): Violation => ({
  where,
  line: null,
  message,
});

const listed = (names: readonly string[]): string =>
  [...names].sort((a, b) => a.localeCompare(b)).join(", ");

/** The kinds an artefact describes. */
export const kindsIn = (artefact: string): string[] =>
  keysAt(artefact, "kinds");

/**
 * One shape as it is matched.
 *
 * A shape's spaces mean whitespace: a sentence wraps where the line ends, and
 * states the same thing either way.
 */
const shape = (said: string): RegExp =>
  new RegExp(said.replaceAll(" ", String.raw`\s+`), "i");

const SAYS_SAME = shape(SAME);
const SAYS_DIFFERS = shape(DIFFERS);

/** What a page has to say about how its client's copy stands. */
export function saidOn(text: string): Said {
  const same = SAYS_SAME.test(text);
  const differs = SAYS_DIFFERS.test(text);
  if (same && differs) return "both";
  if (same) return "same";
  return differs ? "differs" : "neither";
}

/** How the two sets differ, in the direction each member differs in. */
function difference(
  missing: readonly string[],
  extra: readonly string[],
): string {
  const said: string[] = [];
  if (missing.length > 0)
    said.push(
      `the binary serves these and the copy has not: ${listed(missing)}`,
    );
  if (extra.length > 0)
    said.push(
      `the copy has these and the binary serves none of them: ${listed(extra)}`,
    );
  return said.join("; ");
}

/**
 * One client's copy against the served artefact, and its page against both.
 *
 * A copy with no kinds is a violation rather than a clean run, as an empty
 * artefact is: two empty sets agree about everything, so an unreadable copy
 * would report the page as right about it.
 */
function copyViolations(
  serves: readonly string[],
  copy: Copy,
  pages: readonly Page[],
): Violation[] {
  const held = kindsIn(copy.text);
  if (held.length === 0)
    return [
      at(copy.source, "no kinds found — the copy is missing or unreadable"),
    ];

  const has = new Set(held);
  const serving = new Set(serves);
  const missing = serves.filter((kind) => !has.has(kind));
  const extra = held.filter((kind) => !serving.has(kind));
  const agrees = missing.length === 0 && extra.length === 0;

  const text = pages.find((page) => page.path === copy.page)?.text ?? "";
  const said = saidOn(text);

  if (said === "neither")
    return [
      at(
        copy.page,
        `says neither that ${copy.name}'s copy ${SAME} nor that it ${DIFFERS} — a rewording left this watching nothing`,
      ),
    ];

  if (said === "both")
    return [
      at(
        copy.page,
        `says the copy both ${SAME} and ${DIFFERS}, which is one claim too many`,
      ),
    ];

  if (agrees && said === "differs")
    return [
      at(copy.page, `says the copy ${DIFFERS}, and every kind is in both`),
    ];

  if (!agrees && said === "same")
    return [
      at(copy.page, `says the copy ${SAME}, and ${difference(missing, extra)}`),
    ];

  return [];
}

/**
 * What the copies, the served artefact and the pages about them disagree about.
 *
 * An artefact with no kinds is a violation rather than a clean run: a checkout
 * that brought no contract would leave every copy agreeing with it, which is
 * the unchecked sentence this replaces.
 */
export function contractViolations(
  served: string,
  copies: readonly Copy[],
  pages: readonly Page[],
): Violation[] {
  const serves = kindsIn(served);
  if (serves.length === 0)
    return [
      at(SERVED, "no kinds found — the contract is missing or unreadable"),
    ];

  return copies.flatMap((copy) => copyViolations(serves, copy, pages));
}

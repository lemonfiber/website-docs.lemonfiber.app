/**
 * Every number this site states about a tree it does not own.
 *
 * A count transcribed beside a machine-readable source goes false the moment
 * the source moves, and nothing says so. An inventory names where its members
 * come from and the shapes the prose states them in; how many there are is
 * derived on every run and is never written down here.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import type { Violation } from "./guards";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "./mirror.ts";

/** A page of this site's own prose, by repository-relative path. */
export interface Page {
  readonly path: string;
  readonly text: string;
}

/** The trees the numbers are derived from, already read. */
export interface Sources {
  /** `vendor/lemonfiber-media-stack/stack.toml`. */
  readonly stack: string;
  /** `vendor/lemonfiber/contract/web-api.contract.json`. */
  readonly contract: string;
  /** `vendor/lemonfiber/reference/commands.md`. */
  readonly commands: string;
  /** `vendor/spec/20-architecture/contracts/web-api.md`. */
  readonly webApi: string;
  /** `mirrors.json`. */
  readonly mirrors: string;
  /** `vendor/sdk-ts/src/index.ts`, the client package's entry point. */
  readonly clientIndex: string;
  /** `vendor/sdk-php/contract/web-api.contract.json`, the artefact that client
   * was generated from — which is not the one the binary now serves. */
  readonly phpContract: string;
  /** `vendor/sdk-ts/contract/web-api.contract.json`, the same for that client. */
  readonly tsContract: string;
  /** `vendor/sdk-php/composer.json`, the PHP package's manifest. */
  readonly phpManifest: string;
  /** `vendor/lemonfiber-web/package.json`, the web surface's manifest. */
  readonly webManifest: string;
  /** `vendor/lemonfiber-web/src/lib/route.ts`, the console's own list of screens. */
  readonly webRoute: string;
  /** Every path under `vendor/spec`, repository-relative. */
  readonly spec: readonly string[];
}

/** A shape the prose states a count in. `%N%` stands where the number goes. */
export interface Claim {
  /**
   * A regular expression source, matched case-insensitively against every
   * page. It may carry non-capturing groups only: `%N%` is group one.
   */
  readonly says: string;
  /** What the sentence adds to the count — "making the list twenty" adds one. */
  readonly plus?: number;
}

/** A page that sets out the members themselves, not just how many there are. */
export interface Listing {
  readonly page: string;
  readonly members: (text: string) => readonly string[];
}

/** One set of things this site states a number about. */
export interface Inventory {
  /** The members, plural, as a violation names them. */
  readonly what: string;
  /** Where the members are declared, as a violation names it. */
  readonly source: string;
  readonly members: (
    sources: Sources,
    pages: readonly Page[],
  ) => readonly string[];
  readonly claims: readonly Claim[];
  readonly listing?: Listing;
}

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

/** Nought to ninety-nine, spelled as this site's prose spells them. */
const spelled = (): Map<number, string> => {
  const all = new Map<number, string>();
  ONES.forEach((one, n) => all.set(n, one));
  TENS.forEach((ten, t) => {
    const base = (t + 2) * 10;
    all.set(base, ten);
    ONES.slice(1, 10).forEach((one, o) =>
      all.set(base + o + 1, `${ten}-${one}`),
    );
  });
  return all;
};

const SPELLED = spelled();
const NUMBERS = new Map([...SPELLED].map(([n, word]) => [word, n]));

/** The English for a number. Past ninety-nine, prose would write digits. */
export function inWords(count: number): string {
  return SPELLED.get(count) ?? String(count);
}

/** The number a sentence said, whether it spelled it or wrote digits. */
export function asNumber(said: string): number {
  return NUMBERS.get(said.toLowerCase()) ?? Number(said);
}

/**
 * Any number a sentence could have written, as an alternation.
 *
 * Longest first, so `twenty-five` is preferred to the `twenty` inside it.
 */
export const SAID = String.raw`${[...SPELLED.values()]
  .sort((a, b) => b.length - a.length)
  .join("|")}|\d+`;

const NUMBER = String.raw`\b(${SAID})\b`;

/** Every first capture of a pattern, in the order they appear. */
export function matches(pattern: RegExp, text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(pattern)) found.push(captured(match, 1));
  return found;
}

const at = (
  where: string,
  line: number | null,
  message: string,
): Violation => ({
  where,
  line,
  message,
});

/** Names, deduplicated and sorted, so a report reads the same twice. */
const named = (all: readonly string[]): string =>
  [...new Set(all)].sort((a, b) => a.localeCompare(b)).join(", ");

const lineAt = (text: string, index: number): number =>
  text.slice(0, index).split("\n").length;

/**
 * Every sentence stating this count, against the count.
 *
 * A claim nothing matches is a violation rather than a clean run. A reworded
 * sentence would otherwise leave the check watching nothing and reporting
 * success, which is the same unchecked number this replaces.
 */
function claimViolations(
  inventory: Inventory,
  claim: Claim,
  count: number,
  pages: readonly Page[],
): Violation[] {
  const expected = count + (claim.plus ?? 0);
  // A claim's spaces mean whitespace: a sentence wraps where the line ends,
  // and "All\nnineteen are open source" states the same number either way.
  const pattern = new RegExp(
    claim.says.replaceAll(" ", String.raw`\s+`).replaceAll("%N%", NUMBER),
    "gim",
  );
  const found: Violation[] = [];
  let stated = 0;

  for (const page of pages)
    for (const match of page.text.matchAll(pattern)) {
      stated += 1;
      const said = captured(match, 1);
      if (asNumber(said) === expected) continue;
      found.push(
        at(
          page.path,
          lineAt(page.text, match.index),
          `says ${said} where ${inventory.source} has ${inWords(expected)} ${inventory.what}`,
        ),
      );
    }

  if (stated === 0)
    found.push(
      at(
        inventory.source,
        null,
        `nothing states the number of ${inventory.what} as /${claim.says}/ — a rewording left this watching nothing`,
      ),
    );

  return found;
}

/** What the page setting out the members and the source disagree about. */
function listingViolations(
  inventory: Inventory,
  listing: Listing,
  members: readonly string[],
  pages: readonly Page[],
): Violation[] {
  const page = pages.find((one) => one.path === listing.page);
  if (page === undefined)
    return [
      at(
        listing.page,
        null,
        `the page setting out every one of the ${inventory.what} is not here`,
      ),
    ];

  const listed = listing.members(page.text);
  const onPage = new Set(listed);
  const declared = new Set(members);
  const found: Violation[] = [];

  const unlisted = members.filter((one) => !onPage.has(one));
  if (unlisted.length > 0)
    found.push(
      at(
        listing.page,
        null,
        `${inventory.source} has these and the page does not: ${named(unlisted)}`,
      ),
    );

  const invented = listed.filter((one) => !declared.has(one));
  if (invented.length > 0)
    found.push(
      at(
        listing.page,
        null,
        `the page has these and ${inventory.source} does not: ${named(invented)}`,
      ),
    );

  return found;
}

/**
 * Every inventory, against every page.
 *
 * An empty source is a violation rather than a clean run, for the reason an
 * empty error-code reference is: nothing to compare agrees with everything.
 */
export function countViolations(
  inventories: readonly Inventory[],
  sources: Sources,
  pages: readonly Page[],
): Violation[] {
  const found: Violation[] = [];

  for (const inventory of inventories) {
    const members = inventory.members(sources, pages);
    if (members.length === 0) {
      found.push(
        at(
          inventory.source,
          null,
          `no ${inventory.what} found — the source is missing or unreadable`,
        ),
      );
      continue;
    }

    for (const claim of inventory.claims)
      found.push(...claimViolations(inventory, claim, members.length, pages));

    if (inventory.listing !== undefined)
      found.push(
        ...listingViolations(inventory, inventory.listing, members, pages),
      );
  }

  return found;
}

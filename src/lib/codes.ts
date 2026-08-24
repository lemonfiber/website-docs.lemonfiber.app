/**
 * The error-code page against the codes the binary can actually raise.
 *
 * `fixing/every-error-by-code` states that there is no code on it lemonfiber
 * cannot raise, and no code lemonfiber can raise that is missing from it. The
 * crates emit their own list, so that claim is checkable rather than
 * maintained: this compares the two, in both directions.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import { asNumber, inWords, matches, SAID, type Page } from "./counts.ts";
import type { Violation } from "./guards";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "./mirror.ts";

/** A family and a number — `VPN-1`. Never anything else. */
const CODE = /^[A-Z][A-Z0-9]*-\d+$/;

/** One bullet of the generated artefact: `` - `VPN-1` ``. */
const BULLET = /^- `([^`]+)`$/gm;

/** The first cell of a table row on the page: `` | `VPN-1` | … ``. */
const FIRST_CELL = /^\|\s*`([^`]+)`\s*\|/gm;

/** Every code the generated reference lists. */
export function codesInArtefact(text: string): string[] {
  return matches(BULLET, text);
}

/**
 * Every code the page documents.
 *
 * The page carries tables that are not code tables — severities, states and
 * exit codes — whose first cell is a backticked word or digit. Only a family
 * and a number is a code, so only those are compared.
 */
export function codesOnPage(text: string): string[] {
  return matches(FIRST_CELL, text).filter((cell) => CODE.test(cell));
}

const at = (where: string, message: string): Violation => ({
  where,
  line: null,
  message,
});

const PAGE = "src/content/docs/fixing/every-error-by-code.md";
export const ARTEFACT = "vendor/lemonfiber/reference/error-codes.md";

const listed = (codes: readonly string[]): string =>
  [...codes].sort((a, b) => a.localeCompare(b)).join(", ");

/**
 * What the two lists disagree about.
 *
 * An empty artefact is a violation rather than a clean run. Two empty sets
 * agree about everything, so a reference that failed to parse would report the
 * page as perfect — which is the same unchecked claim this replaces, told by a
 * check instead of by a sentence.
 */
export function codeViolations(artefact: string, page: string): Violation[] {
  const raised = codesInArtefact(artefact);
  if (raised.length === 0)
    return [
      at(
        ARTEFACT,
        "no error codes found — the reference is missing or unreadable",
      ),
    ];

  const documented = codesOnPage(page);
  const onPage = new Set(documented);
  const canRaise = new Set(raised);

  const found: Violation[] = [];

  const undocumented = raised.filter((code) => !onPage.has(code));
  if (undocumented.length > 0)
    found.push(
      at(
        PAGE,
        `lemonfiber raises these and the page does not: ${listed(undocumented)}`,
      ),
    );

  const unraisable = documented.filter((code) => !canRaise.has(code));
  if (unraisable.length > 0)
    found.push(
      at(
        PAGE,
        `the page documents these and lemonfiber cannot raise them: ${listed(unraisable)}`,
      ),
    );

  return found;
}

/** A family and how many codes are in it: `` the eight `VPN` codes ``. */
const FAMILY_SIZE = new RegExp(
  `\\b(${SAID})\\s+\`([A-Z][A-Z0-9]*)\`\\s+codes\\b`,
  "gi",
);

/** How many codes each family the reference declares has. */
export function familySizes(artefact: string): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const family of matches(/^- `([A-Z][A-Z0-9]*)-\d+`$/gm, artefact))
    sizes.set(family, (sizes.get(family) ?? 0) + 1);
  return sizes;
}

/**
 * Every sentence naming a family beside how many codes it has.
 *
 * The pages that walk one family — the VPN checks, the storage checks, the
 * support bundle — each send the reader to the code page for "the eight `VPN`
 * codes". A code added to a family upstream reaches the code page through the
 * guard above and leaves those sentences behind, so the number is read out of
 * the reference rather than kept by hand.
 */
export function familyViolations(
  artefact: string,
  pages: readonly Page[],
): Violation[] {
  const sizes = familySizes(artefact);
  if (sizes.size === 0)
    return [
      at(
        ARTEFACT,
        "no error codes found — the reference is missing or unreadable",
      ),
    ];

  const found: Violation[] = [];
  let stated = 0;

  for (const page of pages)
    for (const match of page.text.matchAll(FAMILY_SIZE)) {
      const said = captured(match, 1);
      const family = captured(match, 2);
      const size = sizes.get(family);
      if (size === undefined) continue;
      stated += 1;
      if (asNumber(said) === size) continue;
      found.push({
        where: page.path,
        line: page.text.slice(0, match.index).split("\n").length,
        message: `says ${said} \`${family}\` codes where ${ARTEFACT} declares ${inWords(size)}`,
      });
    }

  if (stated === 0)
    found.push(
      at(
        ARTEFACT,
        "no sentence says how many codes a family has — a rewording left this watching nothing",
      ),
    );

  return found;
}

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

const matches = (pattern: RegExp, text: string): string[] => {
  const found: string[] = [];
  for (const match of text.matchAll(pattern)) found.push(captured(match, 1));
  return found;
};

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
const ARTEFACT = "vendor/lemonfiber/reference/error-codes.md";

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

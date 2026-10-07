/**
 * The error-code pages against the codes the binary can actually raise.
 *
 * Each family of codes has a page under `fixing/codes/`, and
 * `fixing/every-error-by-code` lists the families. The index states that there
 * is no code on those pages lemonfiber cannot raise, and no code lemonfiber can
 * raise that is missing from them. The crates emit their own list, so that
 * claim is checkable rather than maintained: this compares the two, in both
 * directions, and holds each code to its own family's page.
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

/** The first cell of a table row on a page: `` | `VPN-1` | … ``. */
const FIRST_CELL = /^\|\s*`([^`]+)`\s*\|/gm;

/** Every code the generated reference lists. */
export function codesInArtefact(text: string): string[] {
  return matches(BULLET, text);
}

/**
 * Every code a page documents.
 *
 * The index carries tables that are not code tables — severities, states and
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

const DOCS = "src/content/docs";
/** The route the families' pages are served under. */
const SERVED_AT = "fixing/codes";

/** The page that lists every family. */
export const INDEX = `${DOCS}/fixing/every-error-by-code.md`;
/** Where the families' pages are kept, one file per family: `vpn.md`. */
export const FAMILIES = `${DOCS}/${SERVED_AT}`;
export const ARTEFACT = "vendor/lemonfiber/reference/error-codes.md";

/** The family a code belongs to: `VPN` for `VPN-1`. */
const familyOf = (code: string): string => code.slice(0, code.lastIndexOf("-"));

/** The file a family's page is kept in. */
const pageOf = (family: string): string =>
  `${FAMILIES}/${family.toLowerCase()}.md`;

/** The route a family's page is served at, as the index links it. */
const linkOf = (family: string): string =>
  `/${SERVED_AT}/${family.toLowerCase()}/`;

/** The family a page under `FAMILIES` is for: `VPN` for `codes/vpn.md`. */
const familyAt = (path: string): string =>
  path
    .slice(FAMILIES.length + 1)
    .replace(/\.mdx?$/, "")
    .toUpperCase();

/** Whether a page is one of the families' pages. */
export const isFamilyPage = (page: Page): boolean =>
  page.path.startsWith(`${FAMILIES}/`) && /\.mdx?$/.test(page.path);

const listed = (codes: readonly string[]): string =>
  [...codes].sort((a, b) => a.localeCompare(b)).join(", ");

/**
 * What one family's page and the reference disagree about.
 *
 * A code is held to its own family's page: one documented on another family's
 * page is found by nobody who follows the index to the family it names.
 */
function pageViolations(
  page: Page,
  raised: ReadonlySet<string>,
  wanted: readonly string[],
): Violation[] {
  const family = familyAt(page.path);
  const documented = codesOnPage(page.text);
  const onPage = new Set(documented);
  const found: Violation[] = [];

  const undocumented = wanted.filter((code) => !onPage.has(code));
  if (undocumented.length > 0)
    found.push(
      at(
        page.path,
        `lemonfiber raises these and the page does not: ${listed(undocumented)}`,
      ),
    );

  const elsewhere = documented.filter((code) => familyOf(code) !== family);
  if (elsewhere.length > 0)
    found.push(
      at(
        page.path,
        `the page documents these, which belong on another family's page: ${listed(elsewhere)}`,
      ),
    );

  const unraisable = documented.filter(
    (code) => familyOf(code) === family && !raised.has(code),
  );
  if (unraisable.length > 0)
    found.push(
      at(
        page.path,
        `the page documents these and lemonfiber cannot raise them: ${listed(unraisable)}`,
      ),
    );

  return found;
}

/**
 * What the reference, the index and the families' pages disagree about.
 *
 * An empty artefact is a violation rather than a clean run. Two empty sets
 * agree about everything, so a reference that failed to parse would report the
 * pages as perfect — which is the same unchecked claim this replaces, told by a
 * check instead of by a sentence.
 *
 * The families' pages are reached from the index and from nowhere in the
 * sidebar, so a family the index does not link is a page nobody browsing finds.
 */
export function codeViolations(
  artefact: string,
  index: string,
  pages: readonly Page[],
): Violation[] {
  const raised = codesInArtefact(artefact);
  if (raised.length === 0)
    return [
      at(
        ARTEFACT,
        "no error codes found — the reference is missing or unreadable",
      ),
    ];

  const byFamily = new Map<string, string[]>();
  for (const code of raised)
    byFamily.set(familyOf(code), [
      ...(byFamily.get(familyOf(code)) ?? []),
      code,
    ]);
  const canRaise = new Set(raised);
  const paged = new Map(
    pages.filter(isFamilyPage).map((page) => [familyAt(page.path), page]),
  );

  const found: Violation[] = [];

  for (const [family, codes] of byFamily) {
    const page = paged.get(family);
    if (page === undefined)
      found.push(
        at(
          pageOf(family),
          `lemonfiber raises ${listed(codes)} and the \`${family}\` family has no page`,
        ),
      );
    else found.push(...pageViolations(page, canRaise, codes));
  }

  for (const [family, page] of paged)
    if (!byFamily.has(family))
      found.push(
        at(page.path, `lemonfiber raises no code in the \`${family}\` family`),
      );

  const unlinked = [...byFamily.keys()].filter(
    (family) => !index.includes(`](${linkOf(family)})`),
  );
  if (unlinked.length > 0)
    found.push(
      at(
        INDEX,
        `the index does not link these families' pages: ${listed(unlinked)}`,
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

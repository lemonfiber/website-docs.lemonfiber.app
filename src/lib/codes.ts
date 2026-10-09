/**
 * The error-code pages against the registry the core publishes.
 *
 * Each family of codes has a page under `fixing/codes/`, whose table is
 * rendered from `contract/codes.json` by `<CodeTable family="…" />`, and
 * `fixing/every-error-by-code` lists the families with `<CodeFamilies />`. What
 * a page writes by hand is its title and the paragraphs around the table. This
 * holds those to the registry in both directions: a page for every family and a
 * family for every page, each page's table naming its own family, each title
 * the family's, and every code the prose names one the core can raise.
 *
 * Pure functions over text and the parsed registry. Reading the tree is
 * `scripts/guards.ts`.
 */

import { asNumber, inWords, SAID, type Page } from "./counts.ts";
import { codesIn, familyTitle, REGISTRY, type Registry } from "./registry.ts";
import type { Violation } from "@lemonfiber/website-kit/guards";
import { captured } from "@lemonfiber/website-kit/mirror";

const at = (where: string, message: string): Violation => ({
  where,
  line: null,
  message,
});

const lineOf = (text: string, index: number): number =>
  text.slice(0, index).split("\n").length;

const DOCS = "src/content/docs";

/** The route the families' pages are served under. */
const SERVED_AT = "fixing/codes";

/** The page that lists every family. */
export const INDEX = `${DOCS}/fixing/every-error-by-code.mdx`;

/** Where the families' pages are kept, one file per family: `vpn.mdx`. */
export const FAMILIES = `${DOCS}/${SERVED_AT}`;

/** The file a family's page is kept in. */
export const pageOf = (prefix: string): string =>
  `${FAMILIES}/${prefix.toLowerCase()}.mdx`;

/** The route a family's page is served at. */
export const linkOf = (prefix: string): string =>
  `/${SERVED_AT}/${prefix.toLowerCase()}/`;

/** The family a page under `FAMILIES` is for: `VPN` for `codes/vpn.mdx`. */
const familyAt = (path: string): string =>
  path
    .slice(FAMILIES.length + 1)
    .replace(/\.mdx?$/, "")
    .toUpperCase();

/** Whether a page is one of the families' pages. */
export const isFamilyPage = (page: Page): boolean =>
  page.path.startsWith(`${FAMILIES}/`) && /\.mdx?$/.test(page.path);

/** The family a page's table is rendered for. */
const TABLE = /<CodeTable\s+family="([A-Z][A-Z0-9]*)"\s*\/>/g;

/** A page's title, as its frontmatter gives it. */
const TITLE = /^title:\s*(.+)$/m;

/** A row of a table written by hand, starting with a code. */
const HAND_ROW = /^\|\s*`[A-Z][A-Z0-9]*-\d+`\s*\|/m;

/** What the index needs to list every family. */
const LISTING = "<CodeFamilies />";

const listed = (items: Iterable<string>): string =>
  [...items].sort((a, b) => a.localeCompare(b)).join(", ");

/** What one family's page gets wrong about its family. */
function pageViolations(page: Page, title: string): Violation[] {
  const family = familyAt(page.path);
  const found: Violation[] = [];
  const tables = [...page.text.matchAll(TABLE)].map((one) => captured(one, 1));
  if (tables.length !== 1 || tables[0] !== family)
    found.push(
      at(
        page.path,
        `renders ${tables.length === 0 ? "no code table" : `the tables of ${listed(tables)}`}, where it is \`${family}\`'s page: write <CodeTable family="${family}" /> once`,
      ),
    );
  const said = TITLE.exec(page.text);
  if (said === null || captured(said, 1).trim() !== title)
    found.push(at(page.path, `is titled otherwise than "${title}"`));
  const hand = HAND_ROW.exec(page.text);
  if (hand !== null)
    found.push({
      where: page.path,
      line: lineOf(page.text, hand.index),
      message: "writes a code's row by hand; the table is the registry's",
    });
  return found;
}

/**
 * What the registry, the index and the families' pages disagree about.
 *
 * A missing or unreadable registry is a violation rather than a clean run: two
 * empty sets agree about everything.
 */
export function codeViolations(
  registry: Registry | null,
  index: string,
  pages: readonly Page[],
): Violation[] {
  if (registry === null)
    return [at(REGISTRY, "no registry of codes — it is missing or unreadable")];

  const paged = new Map(
    pages.filter(isFamilyPage).map((page) => [familyAt(page.path), page]),
  );
  const declared = new Set(registry.families.map((one) => one.prefix));
  const found: Violation[] = [];

  for (const family of registry.families) {
    const page = paged.get(family.prefix);
    if (page === undefined)
      found.push(
        at(
          pageOf(family.prefix),
          `the \`${family.prefix}\` family raises ${listed(codesIn(registry, family.prefix).map((one) => one.code))} and has no page`,
        ),
      );
    else found.push(...pageViolations(page, familyTitle(family)));
  }

  for (const [family, page] of paged)
    if (!declared.has(family))
      found.push(
        at(page.path, `the registry declares no \`${family}\` family`),
      );

  if (!index.includes(LISTING))
    found.push(at(INDEX, `does not list the families with ${LISTING}`));

  return found;
}

/** A family and how many codes are in it: `` the eight `VPN` codes ``. */
const FAMILY_SIZE = new RegExp(
  `\\b(${SAID})\\s+\`([A-Z][A-Z0-9]*)\`\\s+codes\\b`,
  "gi",
);

/**
 * Every sentence naming a family beside how many codes it has, against the
 * registry. A code added to a family upstream reaches its page through the
 * table and would leave these sentences behind.
 */
export function familyViolations(
  registry: Registry | null,
  pages: readonly Page[],
): Violation[] {
  if (registry === null)
    return [at(REGISTRY, "no registry of codes — it is missing or unreadable")];

  const found: Violation[] = [];
  let stated = 0;

  for (const page of pages)
    for (const match of page.text.matchAll(FAMILY_SIZE)) {
      const said = captured(match, 1);
      const family = captured(match, 2);
      if (!registry.families.some((one) => one.prefix === family)) continue;
      const size = codesIn(registry, family).length;
      stated += 1;
      if (asNumber(said) === size) continue;
      found.push({
        where: page.path,
        line: lineOf(page.text, match.index),
        message: `says ${said} \`${family}\` codes where ${REGISTRY} declares ${inWords(size)}`,
      });
    }

  if (stated === 0)
    found.push(
      at(
        REGISTRY,
        "no sentence says how many codes a family has — a rewording left this watching nothing",
      ),
    );

  return found;
}

/** A code written as code anywhere in prose: `` `VPN-1` ``. */
const MENTIONED = /`([A-Z][A-Z0-9]*-\d+)`/g;

/**
 * Every code a page names that lemonfiber cannot raise, so a code renumbered
 * or retired upstream is not left named as advice.
 */
export function mentionViolations(
  registry: Registry | null,
  pages: readonly Page[],
): Violation[] {
  if (registry === null)
    return [at(REGISTRY, "no registry of codes — it is missing or unreadable")];
  const raised = new Set(registry.codes.map((one) => one.code));
  const retired = new Set(registry.retired);
  const found: Violation[] = [];
  for (const page of pages)
    for (const match of page.text.matchAll(MENTIONED)) {
      const code = captured(match, 1);
      if (raised.has(code)) continue;
      found.push({
        where: page.path,
        line: lineOf(page.text, match.index),
        message: retired.has(code)
          ? `names \`${code}\`, which ${REGISTRY} lists as retired`
          : `names \`${code}\`, which ${REGISTRY} does not declare`,
      });
    }
  return found;
}

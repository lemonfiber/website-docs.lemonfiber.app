/**
 * Reading a table out of a page of markdown.
 *
 * A page states a set two ways: as a sentence saying how many there are, and as
 * a table setting each one out. `counts.ts` holds the first to its source and
 * `inventories.ts` names which table holds the second; this is the reading of
 * the table itself, and it knows nothing about either.
 *
 * Pure functions over text.
 */

import { matches } from "./counts.ts";
import { captured } from "./mirror.ts";

/** A cell as a reader reads it: whatever marked it up, taken off. */
const bare = (cell: string): string => cell.replaceAll("`", "");

/**
 * The first cell of every body row of the tables headed `header`, as written.
 *
 * A page carries tables that are not this table — fields, keys, grades — so
 * the header names which. The cell keeps its markup: what a cell writes as code
 * is a name, and what it does not is the prose carrying it. `columnUnder` is
 * what takes the backticks off.
 */
export function tablesUnder(text: string, header: string): string[][] {
  const tables: string[][] = [];
  let current: string[] | null = null;

  for (const line of text.split("\n")) {
    const row = /^\|([^|]*)\|/.exec(line);
    if (row === null) {
      current = null;
      continue;
    }
    const cell = captured(row, 1).trim();
    if (bare(cell) === header) {
      current = [];
      tables.push(current);
      continue;
    }
    if (current === null) continue;
    if (/^-+$/.test(cell)) continue;
    current.push(cell);
  }

  return tables;
}

/**
 * Every one of them, however many tables they are spread across.
 *
 * Backticks come off: a manifest declares `search`, and the page writes it as
 * code.
 */
export const columnUnder = (text: string, header: string): string[] => [
  ...new Set(tablesUnder(text, header).flat().map(bare)),
];

/** Only the first such table, where a later one lists something else. */
export const firstColumnUnder = (text: string, header: string): string[] =>
  tablesUnder(text, header).map((rows) => rows.map(bare))[0] ?? [];

/**
 * Every name written as code in the first column of the tables headed `header`.
 *
 * For a column whose rows group several names together and say something about
 * them in the same breath. What is code is a name and what is not is the
 * sentence carrying it, so a row may read as English and still be counted
 * exactly.
 */
export const namesUnder = (text: string, header: string): string[] => [
  ...new Set(
    matches(/`([^`]+)`/g, tablesUnder(text, header).flat().join("\n")),
  ),
];

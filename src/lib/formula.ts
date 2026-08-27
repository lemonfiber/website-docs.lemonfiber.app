/**
 * The tap's formula, against what this site says `brew` gets you.
 *
 * `start/install` prints `brew install lemonfiber/tap/<name>` and tells a reader
 * what it resolves to. Both halves are facts about a file in another repository:
 * `brew` loads `Formula/<name>.rb` from the tap, and what that file declares is
 * the whole of what the command can install. The formula is a placeholder today
 * and the pages say so; the release pipeline rewrites it at 1.0.0, and the
 * sentence goes false in the commit that does it.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import { matches, type Page } from "./counts.ts";
import type { Violation } from "./guards";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "./mirror.ts";

/** Where the tap keeps the formulae `brew` reads. */
export const FORMULAE = "vendor/homebrew-tap/Formula";

/** One formula the tap serves. */
export interface Formula {
  /** The file's stem, which is the name `brew install …/<name>` resolves. */
  readonly name: string;
  readonly text: string;
}

/**
 * The version a formula declares: `` version "0.0.0" ``.
 *
 * Spaces and tabs rather than any whitespace: `\s` takes the line ending too,
 * and a run of it in front of a multiline anchor is a run the engine can divide
 * many ways.
 */
const VERSION = /^[ \t]*version[ \t]+"([^"]+)"/m;

/** A tap install as a page prints it. */
const INSTALLS = /brew install lemonfiber\/tap\/([A-Za-z0-9@+._-]+)/g;

/** What a page says the formula declares: `` declares version `0.0.0` ``. */
const DECLARES = /declares version `([^`]+)`/g;

const at = (where: string, message: string): Violation => ({
  where,
  line: null,
  message,
});

const listed = (names: readonly string[]): string =>
  [...new Set(names)].sort((a, b) => a.localeCompare(b)).join(", ");

/** The version a formula declares, or none where it declares no version. */
export function versionIn(text: string): string | null {
  const found = VERSION.exec(text);
  return found === null ? null : captured(found, 1);
}

/** Every formula name the pages tell a reader to install. */
export function installed(pages: readonly Page[]): string[] {
  return pages.flatMap((page) => matches(INSTALLS, page.text));
}

/** Where a page states the version the tap declares, and what it said. */
function stated(pages: readonly Page[]): { page: Page; said: string }[] {
  const found: { page: Page; said: string }[] = [];
  for (const page of pages)
    for (const said of matches(DECLARES, page.text)) found.push({ page, said });
  return found;
}

/**
 * What the tap and the pages that send a reader to it disagree about.
 *
 * An empty tap is a violation rather than a clean run: a checkout that brought
 * no formula would leave two empty sets agreeing about everything, which is the
 * unchecked claim this replaces.
 */
export function formulaViolations(
  formulae: readonly Formula[],
  pages: readonly Page[],
): Violation[] {
  if (formulae.length === 0)
    return [at(FORMULAE, "no formula here — the tap is missing or unreadable")];

  const found: Violation[] = [];
  const versions = new Map<string, string>();

  for (const formula of formulae) {
    const version = versionIn(formula.text);
    if (version === null)
      found.push(
        at(
          `${FORMULAE}/${formula.name}.rb`,
          "declares no version, so there is nothing for a page to state",
        ),
      );
    else versions.set(formula.name, version);
  }

  const served = new Set(formulae.map((one) => one.name));
  const asked = installed(pages);
  const onPage = new Set(asked);

  const unnamed = [...served].filter((name) => !onPage.has(name));
  if (unnamed.length > 0)
    found.push(
      at(
        FORMULAE,
        `the tap serves these and no page tells a reader to install them: ${listed(unnamed)}`,
      ),
    );

  const unserved = asked.filter((name) => !served.has(name));
  if (unserved.length > 0)
    found.push(
      at(
        FORMULAE,
        `a page installs these and the tap serves no formula by that name: ${listed(unserved)}`,
      ),
    );

  found.push(...versionViolations(versions, pages));
  return found;
}

/**
 * Every sentence stating the version the tap declares, against the tap.
 *
 * A sentence nothing matches is a violation rather than a clean run, as an
 * unstated count is: the formula the release pipeline writes carries a real
 * version, and a page that stopped saying which one is a page nothing holds.
 */
function versionViolations(
  versions: ReadonlyMap<string, string>,
  pages: readonly Page[],
): Violation[] {
  const declared = new Set(versions.values());
  if (declared.size === 0) return [];

  const found: Violation[] = [];
  const says = stated(pages);

  for (const { page, said } of says)
    if (!declared.has(said))
      found.push(
        at(
          page.path,
          `says the formula declares ${said} where the tap declares ${listed([...declared])}`,
        ),
      );

  if (says.length === 0)
    found.push(
      at(
        FORMULAE,
        "no page says which version the tap's formula declares — a rewording left this watching nothing",
      ),
    );

  return found;
}

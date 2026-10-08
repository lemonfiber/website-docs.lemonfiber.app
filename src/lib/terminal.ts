/**
 * The dashboard's panels as `commands/the-tui` sets them out, against the panels
 * the binary lays out.
 *
 * The terminal dashboard names each panel where it builds it, as the heading it
 * draws: `("VPN", vpn)`. The page's table and the sentence counting them go
 * false in the commit that adds one.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import type { Violation } from "@lemonfiber/website-kit/guards";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "@lemonfiber/website-kit/mirror";

import { asNumber, at, inWords, lineAt, type Page, SAID } from "./counts.ts";
import { columnUnder } from "./tables.ts";

/** Where the terminal dashboard lays its panels out. */
export const DASHBOARD = "vendor/lemonfiber/crates/lemonfiber/src/dashboard.rs";

/** The page that sets the panels out. */
export const TUI_PAGE = "src/content/docs/commands/the-tui.md";

/** One panel as the layout names it, alone on its line: `("Front door", door),`. */
const PANEL = /^\("([^"]+)", [a-z_]+\),$/;

/** The sentence counting them: `nine panels`. */
const COUNTED = new RegExp(String.raw`\b(${SAID}) panels\b`, "gi");

/** Every panel the dashboard draws, by the heading it draws it under. */
export const panelsIn = (dashboard: string): string[] =>
  dashboard.split("\n").flatMap((line) => {
    const panel = PANEL.exec(line.trim());
    return panel === null ? [] : [captured(panel, 1)];
  });

/**
 * The page's `Panel` table against the layout in both directions, and every
 * sentence counting the panels against how many there are.
 */
export function panelViolations(
  dashboard: string,
  pages: readonly Page[],
): Violation[] {
  const drawn = panelsIn(dashboard);
  if (drawn.length === 0)
    return [
      at(
        DASHBOARD,
        null,
        "lays out no panel, so the page cannot be held to it",
      ),
    ];
  const page = pages.find((one) => one.path === TUI_PAGE);
  if (page === undefined)
    return [at(TUI_PAGE, null, "the page setting out the panels is not here")];
  const found: Violation[] = [];
  const listed = columnUnder(page.text, "Panel");
  const missing = drawn.filter((panel) => !listed.includes(panel));
  const invented = listed.filter((panel) => !drawn.includes(panel));
  if (missing.length > 0)
    found.push(
      at(
        TUI_PAGE,
        null,
        `${DASHBOARD} draws these and the page does not: ${missing.join(", ")}`,
      ),
    );
  if (invented.length > 0)
    found.push(
      at(
        TUI_PAGE,
        null,
        `the page has these and ${DASHBOARD} does not draw them: ${invented.join(", ")}`,
      ),
    );
  let stated = 0;
  for (const match of page.text.matchAll(COUNTED)) {
    stated += 1;
    const said = captured(match, 1);
    if (asNumber(said) === drawn.length) continue;
    found.push(
      at(
        TUI_PAGE,
        lineAt(page.text, match.index),
        `says ${said} panels where ${DASHBOARD} draws ${inWords(drawn.length)}`,
      ),
    );
  }
  if (stated === 0)
    found.push(
      at(
        TUI_PAGE,
        null,
        "no sentence says how many panels there are — a rewording left this watching nothing",
      ),
    );
  return found;
}

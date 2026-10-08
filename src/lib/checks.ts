/**
 * The doctor's checks a page names, against the checks the binary registers.
 *
 * A page that tells a reader to run `lemonfiber doctor --accept vpn.unprotected`,
 * or that sets out what `vpn.killswitch` establishes, names a check by the
 * identity a finding carries. The core keeps every bundled identity in one list,
 * `BUNDLED_CHECKS`, held to the code that emits them; a renamed check leaves the
 * old name on the page, naming nothing.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import type { Violation } from "@lemonfiber/website-kit/guards";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "@lemonfiber/website-kit/mirror";

import { at, lineAt, type Page } from "./counts.ts";
import { columnUnder } from "./tables.ts";

/** Where the core registers the identities its bundled checks report against. */
export const REGISTER =
  "vendor/lemonfiber/crates/lemonfiber-core/src/doctor/bundled.rs";

/** The page that sets out the VPN checks, one row each. */
export const VPN_PAGE = "src/content/docs/fixing/is-my-vpn-hiding-me.md";

/** The list itself: `pub const BUNDLED_CHECKS: &[&str] = &[` to its closing `];`. */
const LIST = /pub const BUNDLED_CHECKS: &\[&str\] = &\[([^\]]*)\];/;

/** One entry of it. */
const ENTRY = /"([^"]+)"/g;

/**
 * A check's identity: written as code on its own, or given to the doctor's
 * `--accept` or `--only` in a command line.
 */
const NAMED =
  /(?:`|--(?:accept|only)[ =])([a-z]+\.[a-z0-9.-]*[a-z0-9])(?=[`\s]|$)/gm;

/** A file name written as code, `services.txt`, which no check is. */
const FILE = /\.(?:txt|json|toml|ya?ml|md|log|pem|gz|zip|env|sh|html)$/;

/** Every identity the register lists. One ending in a dot is a family. */
export function registered(register: string): string[] {
  const list = LIST.exec(register);
  return list === null
    ? []
    : [...captured(list, 1).matchAll(ENTRY)].map((entry) => captured(entry, 1));
}

/** Whether an identity is one the register lists, or one inside a family it lists. */
const known = (identity: string, listed: readonly string[]): boolean =>
  listed.some((entry) =>
    entry.endsWith(".") ? identity.startsWith(entry) : identity === entry,
  );

/**
 * Every check a page names that the binary does not register, and the VPN
 * page's table against the register's VPN checks in both directions.
 *
 * Only a name in one of the register's own categories is read as a check, and
 * a file name written as code is left alone. An empty register is a violation
 * rather than a clean run.
 */
export function checkViolations(
  register: string,
  pages: readonly Page[],
): Violation[] {
  const listed = registered(register);
  if (listed.length === 0)
    return [at(REGISTER, null, "lists no check, so no page can be held to it")];
  const categories = new Set(listed.map((entry) => entry.split(".")[0]));
  const found: Violation[] = [];
  for (const page of pages)
    for (const match of page.text.matchAll(NAMED)) {
      const identity = captured(match, 1);
      const category = identity.slice(0, identity.indexOf("."));
      if (!categories.has(category) || FILE.test(identity)) continue;
      if (known(identity, listed)) continue;
      found.push(
        at(
          page.path,
          lineAt(page.text, match.index),
          `names the check \`${identity}\`, which ${REGISTER} does not register`,
        ),
      );
    }
  found.push(...vpnTable(listed, pages));
  return found;
}

/** The VPN page's `Check` table against every VPN check the register lists. */
function vpnTable(
  listed: readonly string[],
  pages: readonly Page[],
): Violation[] {
  const page = pages.find((one) => one.path === VPN_PAGE);
  if (page === undefined)
    return [
      at(VPN_PAGE, null, "the page setting out the VPN checks is not here"),
    ];
  const onPage = new Set(columnUnder(page.text, "Check"));
  const missing = listed.filter(
    (entry) =>
      entry.startsWith("vpn.") && !entry.endsWith(".") && !onPage.has(entry),
  );
  return missing.length === 0
    ? []
    : [
        at(
          VPN_PAGE,
          null,
          `${REGISTER} registers these VPN checks and the page does not set them out: ${missing.join(", ")}`,
        ),
      ];
}

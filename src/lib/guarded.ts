/**
 * Every path a guard in this site reads to hold a page to.
 *
 * Taken from the declarations themselves rather than listed again here: an
 * inventory names the tree its members come from, and each guard that is not
 * one names the artefact it holds a page to. The kit's pin check adds every
 * mirror on top, from `mirrors.json`.
 */
import { HEALTH } from "@lemonfiber/website-kit/health";
import { TOKENS } from "@lemonfiber/website-kit/tokens";

import { ARTEFACT } from "./codes.ts";
import { FORMULAE } from "./formula.ts";
import { INVENTORIES } from "./inventories.ts";

/** The sources of the guards that are not inventories. */
const ARTEFACTS: readonly string[] = [ARTEFACT, FORMULAE, TOKENS, HEALTH];

export const GUARDED: readonly string[] = [
  ...new Set([...ARTEFACTS, ...INVENTORIES.map((one) => one.source)]),
].sort((a, b) => a.localeCompare(b));

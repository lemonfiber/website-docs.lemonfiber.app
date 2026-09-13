/**
 * The maturities this site can draw, held to the ones the catalogue defines.
 *
 * The version train already holds a *page* to that enum: `the-version-train.md`
 * has a row per maturity and an inventory fails the build if one is missing. What
 * nothing asked is whether the site can *draw* one. `MaturityPill.astro` carried a
 * label for four of the five and fell back to `planned` for anything else, so the
 * day `built` arrived in the catalogue every finished feature on the roadmap was
 * drawn as not started — the most wrong of the five answers available, on the page
 * whose whole subject is how far each feature has got, with the prose two sections
 * above it correctly listing all five.
 *
 * That is the shape of a guard narrower than the thing it guards, and the fix is
 * to ask the second question rather than to widen the first: a page that lists a
 * maturity and a component that cannot render it are two different claims.
 *
 * Pure functions over text. The component is Astro rather than TypeScript, so it
 * is read as text — and reading the file that ships is what makes this a check on
 * the artefact rather than on a copy of it.
 */

import { captured } from "./mirror.ts";
import { enumAt } from "./sources.ts";

/** Where the pill's labels are declared, by repository-relative path. */
export const PILL = "src/components/MaturityPill.astro";

/** Where the catalogue states which maturities exist. */
export const SCHEMA =
  "vendor/spec/10-functional/features/_meta/feature.schema.json";

/**
 * One `name: m.message_name,` line of the component's label map.
 *
 * Indentation is `[ \t]*` rather than `\s*`: `\s` matches a newline, so under `m`
 * the run at the front of one line can reach back over the one before it and the
 * pass stops being linear in the file's length.
 */
const LABELLED = /^[ \t]*([a-z][a-z0-9_]*):[ \t]*m\.\w+[ \t]*,/gm;

/**
 * The maturities the component has a label for, in the order it declares them.
 *
 * Read out of the `LABEL` block alone. Taking the whole file would pick up the
 * `.mpill--shipped` rules in the stylesheet below it, and a maturity with a colour
 * and no word is exactly the case this is meant to catch.
 */
export function rendered(component: string): string[] {
  const opened = component.indexOf("const LABEL");
  if (opened === -1) return [];
  const closed = component.indexOf("};", opened);
  if (closed === -1) return [];
  const block = component.slice(opened, closed);
  return [...block.matchAll(LABELLED)].map((one) => captured(one, 1));
}

/** The maturities the catalogue's schema allows a feature to stand at. */
export function allowed(schema: string): string[] {
  return enumAt(schema, "properties", "maturity");
}

/**
 * The maturities the catalogue allows and this site cannot draw a word for.
 *
 * The direction that matters: one of these is rendered as something it is not.
 */
export function undrawable(schema: string, component: string): string[] {
  const has = new Set(rendered(component));
  return allowed(schema).filter((one) => !has.has(one));
}

/**
 * The labels this site carries for a maturity the catalogue no longer has.
 *
 * Harmless to a reader and worth saying anyway: it is a word nothing can reach,
 * and the only evidence that the two lists were ever compared.
 */
export function unreachable(schema: string, component: string): string[] {
  const has = new Set(allowed(schema));
  return rendered(component).filter((one) => !has.has(one));
}

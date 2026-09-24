/**
 * The contract artefacts the reference pages render, read out of the checkout.
 *
 * One call per artefact and no branch of its own, so every decision about what
 * was read stays in `schema.ts` and `plugins.ts`, where it is a function of its
 * arguments.
 */
import { readText } from "./project-source";
import { parsedJson } from "./schema";

const CONTRACT = "vendor/lemonfiber/contract";

/** One artefact under the pinned binary's `contract/`, parsed. */
export const artefact = (name: string): unknown =>
  parsedJson(readText(`${CONTRACT}/${name}`));

/** One file of a pinned tree, as text, or empty where the checkout lacks it. */
export const vendored = (path: string): string =>
  readText(`vendor/${path}`) ?? "";

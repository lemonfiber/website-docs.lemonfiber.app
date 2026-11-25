/**
 * The contract artefacts the reference pages render, read out of the checkout.
 *
 * One call per artefact and no branch of its own, so every decision about what
 * was read stays in `schema.ts` and `plugins.ts`, where it is a function of its
 * arguments.
 */
import { assembledContract, CONTRACT_DIRECTORY } from "./contract";
import { readText } from "./checkout";
import { parsedJson } from "./schema";
import { parseRegistry, REGISTRY, type Registry } from "./registry";
import { BUNDLE_CHECKOUT, BUNDLE_ROOT, bundledStack } from "./stack";

const CONTRACT = "vendor/lemonfiber/contract";

/** One artefact under the pinned binary's `contract/`, parsed. */
export const artefact = (name: string): unknown =>
  parsedJson(readText(`${CONTRACT}/${name}`));

/** The web API's contract, put back together from its directory. */
export const contract = (): unknown =>
  assembledContract((file) => readText(`${CONTRACT_DIRECTORY}/${file}`));

/** One file of a pinned tree, as text, or empty where the checkout lacks it. */
export const vendored = (path: string): string =>
  readText(`vendor/${path}`) ?? "";

/** One file of the pinned bundle, by its path from the bundle's root, or null. */
export const inBundle = (entry: string): string | null =>
  readText(`${BUNDLE_CHECKOUT}/${entry}`);

/** The stack the pinned bundle ships, with a service for each plugin it pins. */
export const stack = (): string =>
  bundledStack(inBundle(BUNDLE_ROOT), inBundle);

/** lemonfiber's registry of problem codes, from the pinned core. */
export const registry = (): Registry | null =>
  parseRegistry(readText(REGISTRY));

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
import { joinedStack, STACK_CHECKOUT, STACK_ROOT } from "./stack";

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

/** One file of the pinned media stack, by its path from the stack's root, or null. */
export const inStack = (entry: string): string | null =>
  readText(`${STACK_CHECKOUT}/${entry}`);

/** The pinned stack manifest, its root and every service file it includes, as one. */
export const stack = (): string => joinedStack(inStack(STACK_ROOT), inStack);

/** lemonfiber's registry of problem codes, from the pinned core. */
export const registry = (): Registry | null =>
  parseRegistry(readText(REGISTRY));

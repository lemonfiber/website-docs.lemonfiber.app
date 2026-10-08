/**
 * What the pages built from the checkout need from outside this process.
 *
 * Each is one call, so every decision about what was read stays in the module
 * that reads it, where it is a function of its arguments.
 */
import { readFileSync } from "node:fs";

import { parseRevision, type Revision } from "@lemonfiber/website-kit/mirror";
import { gitLog } from "@lemonfiber/website-kit/mirror-source";

/** One file's text, or nothing where the checkout does not hold it. */
export function readText(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/** The revision a checked-out repository sits on, or nothing where git cannot say. */
export function revisionAt(directory: string): Revision | null {
  try {
    return parseRevision(gitLog(directory));
  } catch {
    return null;
  }
}

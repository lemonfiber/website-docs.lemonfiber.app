/**
 * The one thing the project pages need from outside this process.
 *
 * It is a single call with no branch of its own, so every decision about what
 * to do with what was read stays in `project.ts`, where it is a function of its
 * arguments.
 */
import { readFileSync } from "node:fs";

/** One file's text, or nothing where the checkout does not hold it. */
export function readText(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

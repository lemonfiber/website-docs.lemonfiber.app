/**
 * The Rust toolchain a page says building lemonfiber needs, against the one the
 * workspace names.
 *
 * `start/install` tells a reader building from source which toolchain to have.
 * The workspace states the same thing as `rust-version`, and cargo refuses an
 * older toolchain by it, so the sentence goes false in the commit that raises
 * it.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import { parse } from "smol-toml";

import { at, lineAt, type Page } from "./counts.ts";
import type { Violation } from "@lemonfiber/website-kit/guards";
// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "@lemonfiber/website-kit/mirror";

/** The workspace manifest that names the toolchain. */
export const WORKSPACE = "vendor/lemonfiber/Cargo.toml";

/** What a page says: `a Rust toolchain, 1.95 or newer`. */
const NEEDS = /Rust toolchain,\s+(\d+\.\d+(?:\.\d+)?)\s+or\s+newer/g;

/** A value read as a table: anything that is not an object reads as empty. */
const table = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

/**
 * The `rust-version` a manifest names, the workspace's first and the package's
 * where there is no workspace, or null where it names none or does not parse.
 */
export function rustVersionIn(manifest: string): string | null {
  let read: Record<string, unknown>;
  try {
    read = parse(manifest);
  } catch {
    return null;
  }
  const named =
    table(table(read["workspace"])["package"])["rust-version"] ??
    table(read["package"])["rust-version"];
  return typeof named === "string" ? named : null;
}

/**
 * Every sentence naming the toolchain, against the workspace.
 *
 * A manifest naming no toolchain, and pages naming none, are violations rather
 * than a clean run: either leaves nothing to compare, which is the unchecked
 * sentence this replaces.
 */
export function toolchainViolations(
  manifest: string,
  pages: readonly Page[],
): Violation[] {
  const named = rustVersionIn(manifest);
  if (named === null)
    return [
      at(WORKSPACE, null, "names no `rust-version`, so no page can state it"),
    ];

  const found: Violation[] = [];
  let stated = 0;
  for (const page of pages)
    for (const said of page.text.matchAll(NEEDS)) {
      stated += 1;
      const version = captured(said, 1);
      if (version === named) continue;
      const start = said.index + said[0].indexOf(version);
      found.push({
        ...at(
          page.path,
          lineAt(page.text, said.index),
          `says a Rust toolchain, ${version} or newer, where ${WORKSPACE} names ${named}`,
        ),
        fix: {
          path: page.path,
          start,
          end: start + version.length,
          replacement: named,
        },
      });
    }
  if (stated === 0)
    found.push(
      at(
        WORKSPACE,
        null,
        `no page states the toolchain as /${NEEDS.source}/ — a rewording left this watching nothing`,
      ),
    );
  return found;
}

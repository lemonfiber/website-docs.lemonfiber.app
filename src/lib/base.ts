/**
 * The built site's root-relative addresses, under the path it is published at.
 *
 * Each version of this site is built for its own path: the newest stable at `/`,
 * `next` at `/next/`, a kept version at `/v0.17/` (REPO-R89). Pages are written
 * against the root, as `/fixing/`, and so are the routes the mirror loader
 * rewrites a mirrored link to. Starlight puts the base in front of the addresses
 * it writes itself; this puts it in front of every other one, in the built HTML,
 * so that no page has to know which version it is built into.
 *
 * Done on the output rather than on each page as it renders: the output is one
 * format, where the pages are Markdown, MDX and components.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { AstroIntegration } from "astro";

/**
 * An `href` or `src` attribute whose value starts at the root, or the address a
 * redirect page refreshes to.
 */
const ROOTED = /(\s(?:href|src)="|\scontent="0;url=)(\/[^"]*)"/g;

/** `address` under `base`, where it is root-relative and not already there. */
export function underBase(address: string, base: string): string {
  if (base === "/" || !address.startsWith("/") || address.startsWith("//"))
    return address;
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  return address === prefix || address.startsWith(`${prefix}/`)
    ? address
    : `${prefix}${address}`;
}

/** Where a build is published, and where it sends a reader for a page it lacks. */
export interface Placing {
  readonly base: string;
  /**
   * The version a versioned build sends a reader to for a page it does not
   * have, `/next/`; null for the build from the submodule pins, which has them
   * all.
   */
  readonly fallback: string | null;
}

const trimmed = (path: string): string =>
  path.endsWith("/") ? path.slice(0, -1) : path;

/**
 * Where a root-relative address lands. A page this build has is read under its
 * base; a page it lacks, in a versioned build, is read in the fallback version,
 * since an authored page can name one that was added after the release. `has`
 * says whether this build serves a route.
 */
export function place(
  address: string,
  placing: Placing,
  has: (route: string) => boolean,
): string {
  if (!address.startsWith("/") || address.startsWith("//")) return address;
  const prefix = trimmed(placing.base);
  const route =
    prefix !== "" && address.startsWith(`${prefix}/`)
      ? address.slice(prefix.length)
      : address;
  const path = route.replace(/[#?].*$/s, "");
  if (placing.fallback !== null && path.endsWith("/") && !has(path))
    return `${trimmed(placing.fallback)}${route}`;
  return underBase(route, placing.base);
}

/** One page of built HTML with every root-relative address placed. */
export const withBase = (
  html: string,
  placing: Placing,
  has: (route: string) => boolean,
): string =>
  html.replace(
    ROOTED,
    (_whole, lead: string, address: string) =>
      `${lead}${place(address, placing, has)}"`,
  );

/** Every `.html` file under `directory`, recursively. */
async function pages(directory: string): Promise<string[]> {
  const entries = await readdir(directory, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** Rewrite every page under `directory`; says how many changed. */
export async function rebase(
  directory: string,
  placing: Placing,
): Promise<number> {
  if (placing.base === "/" && placing.fallback === null) return 0;
  const files = await pages(directory);
  const routes = new Set(
    files
      .filter((path) => path.endsWith("/index.html"))
      .map((path) =>
        path.slice(directory.length, -"index.html".length).replace(/^\/*/, "/"),
      ),
  );
  const has = (route: string): boolean => routes.has(route);
  let changed = 0;
  for (const path of files) {
    const html = await readFile(path, "utf8");
    const rebased = withBase(html, placing, has);
    if (rebased !== html) {
      await writeFile(path, rebased);
      changed += 1;
    }
  }
  return changed;
}

/** The integration: once the site is built, its addresses placed. */
export const baseIntegration = (placing: Placing): AstroIntegration => ({
  name: "lemonfiber-docs-base",
  hooks: {
    "astro:build:done": async ({ dir, logger }) => {
      const changed = await rebase(dir.pathname, placing);
      if (changed > 0)
        logger.info(`${String(changed)} page(s) placed under ${placing.base}`);
    },
  },
});

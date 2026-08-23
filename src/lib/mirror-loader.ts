/**
 * The content loader that puts mirrored prose into Starlight's collection.
 *
 * It reads through the symlink at each declared route, so the bytes it renders
 * are the submodule's own, at the revision this repository pins. Every page it
 * stores carries the revision it came from and an edit link into the repository
 * that owns it.
 *
 * Mirrors are read in two passes. The first learns every route every mirror
 * will serve; the second renders, so a link from one repository's prose into
 * another's can land on this site rather than leaving it.
 */
import { pathToFileURL } from "node:url";

import type { Loader, LoaderContext } from "astro/loaders";

import {
  attributedPath,
  crossTable,
  editUrl,
  isFile,
  isIncluded,
  parseRevision,
  rewriteLinks,
  routeOf,
  routeTable,
  sourceUrl,
  titleOf,
  withoutLeadingHeading,
  type Mirror,
  type Revision,
} from "./mirror";
import { gitLog, listing, read } from "./mirror-source";

/** What the site knows about where a mirrored page came from. */
export interface Provenance {
  readonly repo: string;
  readonly label: string;
  readonly revision: string;
  readonly date: string;
  readonly source: string;
}

/** One mirror, resolved against the checkout. */
export interface Reading {
  readonly mirror: Mirror;
  readonly revision: Revision;
  readonly relatives: readonly string[];
}

const CONTENT = "src/content/docs";

/**
 * Sorted the way the paths read, not the way a locale would order them. A
 * directory listing holds each path once, so there is no equal pair to order.
 */
export const byCodePoint = (a: string, b: string): number => (a < b ? -1 : 1);

/** The paths a mirror renders, relative to the mirror's own root. */
export function pagesOf(mirror: Mirror, root: string): string[] {
  if (isFile(mirror)) return [""];
  return listing(`${root}/${CONTENT}/${mirror.route}`)
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => isIncluded(mirror, entry))
    .sort(byCodePoint);
}

/** Where a page is filed, relative to the repository root. */
export function fileOf(mirror: Mirror, relative: string): string {
  const base = `${CONTENT}/${mirror.route}`;
  return isFile(mirror) ? base : `${base}/${relative}`;
}

/** Where a page's bytes are, through the symlink that declares the mirror. */
export function pathOf(mirror: Mirror, root: string, relative: string): string {
  return `${root}/${fileOf(mirror, relative)}`;
}

/** What this repository pins, and what that revision holds. */
export function readingOf(mirror: Mirror, root: string): Reading {
  return {
    mirror,
    revision: parseRevision(gitLog(`${root}/vendor/${mirror.repo}`)),
    relatives: pagesOf(mirror, root),
  };
}

/** Every mirrored file, keyed by its address on its own forge. */
export function crossRoutes(readings: readonly Reading[]): Map<string, string> {
  const table = new Map<string, string>();
  for (const reading of readings)
    for (const [key, route] of crossTable(reading.mirror, reading.relatives))
      table.set(key, route);
  return table;
}

const missing = (mirror: Mirror, relative: string): Error =>
  new Error(
    `mirror ${mirror.route}: ${relative} has no title, and none is declared for it`,
  );

/** Stores every page one mirror renders. */
export async function storeMirror(
  context: LoaderContext,
  reading: Reading,
  root: string,
  cross: ReadonlyMap<string, string>,
): Promise<void> {
  const { mirror, revision, relatives } = reading;
  const routes = routeTable(mirror, relatives);

  for (const relative of relatives) {
    const source = read(pathOf(mirror, root, relative));
    const declared = isFile(mirror) ? mirror.title : mirror.titles?.[relative];
    const title = titleOf(source, declared);
    if (title === null) throw missing(mirror, relative);

    const id = routeOf(mirror, relative);
    const body = rewriteLinks(
      withoutLeadingHeading(source),
      mirror,
      revision,
      relative,
      routes,
      cross,
    );
    const provenance: Provenance = {
      repo: mirror.repo,
      label: mirror.label,
      revision: revision.sha,
      date: revision.date,
      source: sourceUrl(mirror, revision, relative),
    };
    const data = await context.parseData({
      id,
      data: {
        title,
        editUrl: editUrl(mirror, relative),
        lastUpdated: new Date(revision.date),
        mirror: provenance,
      },
    });
    context.store.set({
      id,
      data,
      body,
      filePath: fileOf(mirror, relative),
      digest: context.generateDigest(`${revision.sha}:${source}`),
      rendered: await context.renderMarkdown(body, {
        fileURL: pathToFileURL(`${root}/${attributedPath(id)}`),
      }),
    });
  }
}

/** The loader itself: every declared mirror, in the order they are declared. */
export function mirrorLoader(mirrors: readonly Mirror[], root: string): Loader {
  return {
    name: "lemonfiber-mirror-loader",
    load: async (context: LoaderContext): Promise<void> => {
      const readings = mirrors.map((mirror) => readingOf(mirror, root));
      const cross = crossRoutes(readings);
      for (const reading of readings)
        await storeMirror(context, reading, root, cross);
    },
  };
}

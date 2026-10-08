/**
 * The versions the site publishes, and where the switcher sends a reader.
 *
 * The deploy writes `/versions.json` once every build is in place: each version
 * with the path it is published at, and the routes each one serves, read from
 * that build's `provenance.json`. Every build's switcher reads it at run time,
 * so a version frozen before a newer one existed still names the newer one
 * (REPO-R90).
 *
 * Pure: the deploy hands in the builds, the switcher hands in where it is.
 */

/** The version built from the submodule pins. */
export const NEXT = "next";

/** One published version. */
export interface Published {
  /** `next`, or the minor, as `0.17`. */
  readonly label: string;
  /** The path it is published at, as `/` or `/v0.16/`. */
  readonly path: string;
}

/** What `/versions.json` holds. */
export interface Versions {
  readonly versions: readonly Published[];
  /** Every route each version serves, by the path it is published at. */
  readonly routes: Readonly<Record<string, readonly string[]>>;
}

/** One build, as the deploy has it. */
export interface Built extends Published {
  readonly routes: readonly string[];
}

/** The index of every build: `next` first, then the releases newest first. */
export function versionsIndex(builds: readonly Built[]): Versions {
  const order = (one: Published): number[] =>
    one.label === NEXT
      ? [Number.POSITIVE_INFINITY]
      : one.label.split(".").map((part) => Number.parseInt(part, 10));
  const newestFirst = builds.toSorted((a, b) => {
    const [left, right] = [order(a), order(b)];
    for (let at = 0; at < Math.max(left.length, right.length); at += 1) {
      const difference = (right[at] ?? 0) - (left[at] ?? 0);
      if (difference !== 0) return difference;
    }
    return 0;
  });
  return {
    versions: newestFirst.map(({ label, path }) => ({ label, path })),
    routes: Object.fromEntries(
      newestFirst.map((one) => [one.path, [...one.routes]]),
    ),
  };
}

/** The route a page is, without the path its build is published at. */
export function routeIn(pathname: string, base: string): string {
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  return prefix !== "" && pathname.startsWith(`${prefix}/`)
    ? pathname.slice(prefix.length)
    : pathname;
}

/**
 * Where reading `route` in `target` lands: the same route where that version
 * serves it, and that version's front page where it does not.
 */
export function targetOf(
  versions: Versions,
  target: string,
  route: string,
): string {
  const served = versions.routes[target] ?? [];
  return served.includes(route) ? `${target}${route.slice(1)}` : target;
}

/** The index, read from text, or null where the text is not one. */
export function parseVersions(text: string): Versions | null {
  let read: unknown;
  try {
    read = JSON.parse(text);
  } catch {
    return null;
  }
  const versions = (read as { versions?: unknown } | null)?.versions;
  const routes = (read as { routes?: unknown } | null)?.routes;
  if (!Array.isArray(versions) || typeof routes !== "object" || routes === null)
    return null;
  return read as Versions;
}

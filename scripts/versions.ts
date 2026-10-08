#!/usr/bin/env node
/**
 * Writes `versions.json` into a stitched site, from the builds it holds
 * (REPO-R89, REPO-R90).
 *
 *   node scripts/versions.ts <site> <latest>
 *
 * `<site>` holds the newest stable at its root, `next/`, and one `v<minor>/`
 * per kept version; `<latest>` is the newest stable's minor. Each build's routes
 * are the keys of its own `provenance.json`. The newest stable is listed once,
 * at `/`, though its frozen copy is published at its own path as well.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { NEXT, versionsIndex, type Built } from "../src/lib/versions.ts";

const [site, latest] = process.argv.slice(2);
if (site === undefined || latest === undefined) {
  console.error("::error::usage: node scripts/versions.ts <site> <latest>");
  process.exit(1);
}

const routesOf = (directory: string): string[] => {
  const index = join(directory, "provenance.json");
  if (!existsSync(index)) {
    console.error(`::error::${index} is missing, so its routes are unknown`);
    process.exit(1);
  }
  return Object.keys(JSON.parse(readFileSync(index, "utf8")) as object);
};

const kept = readdirSync(site, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^v\d+\.\d+$/.test(entry.name))
  .map((entry) => entry.name.slice(1))
  .filter((label) => label !== latest);

const builds: Built[] = [
  { label: NEXT, path: "/next/", routes: routesOf(join(site, "next")) },
  { label: latest, path: "/", routes: routesOf(site) },
  ...kept.map((label) => ({
    label,
    path: `/v${label}/`,
    routes: routesOf(join(site, `v${label}`)),
  })),
];

writeFileSync(
  join(site, "versions.json"),
  `${JSON.stringify(versionsIndex(builds))}\n`,
);
const named = builds.map((one) => one.label + " at " + one.path);
console.log(`versions: ${named.join(", ")}`);

#!/usr/bin/env node
/** Reads the tree and applies the rules in src/lib/guards.ts. */
import { readdir, readFile, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import { codeViolations, familyViolations } from "../src/lib/codes.ts";
import { countViolations, type Page } from "../src/lib/counts.ts";
import {
  formulaViolations,
  FORMULAE,
  type Formula,
} from "../src/lib/formula.ts";
import { INVENTORIES } from "../src/lib/inventories.ts";
import { lockViolations } from "../src/lib/lockfile.ts";
import {
  collisionViolations,
  fileViolations,
  format,
  mirrorViolations,
  routeOf,
  type Declared,
  type MirrorState,
  type SourceFile,
  type Violation,
} from "../src/lib/guards.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const CONTENT = join(ROOT, "src", "content", "docs");
const GENERATED = [`${sep}paraglide${sep}`, `${sep}generated${sep}`];

const rel = (p: string): string => relative(ROOT, p).split(sep).join("/");

async function walk(
  dir: string,
  files: string[],
  links: string[],
): Promise<void> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) links.push(path);
    else if (entry.isDirectory()) await walk(path, files, links);
    else files.push(path);
  }
}

const paths: string[] = [];
const links: string[] = [];
await walk(join(ROOT, "src"), paths, links);
await walk(join(ROOT, "scripts"), paths, links);

const kept = paths.filter((p) => !GENERATED.some((d) => p.includes(d)));
const authored = kept.filter((p) => !p.startsWith(CONTENT + sep));

const found: Violation[] = [];
for (const path of authored) {
  const file: SourceFile = {
    path: rel(path),
    text: await readFile(path, "utf8"),
  };
  found.push(...fileViolations(file));
}

const manifest: unknown = JSON.parse(
  await readFile(join(ROOT, "mirrors.json"), "utf8"),
);
const declared = (manifest as { mirrors: Declared[] }).mirrors;

const state: MirrorState[] = [];
for (const link of links.filter((l) => l.startsWith(CONTENT + sep))) {
  let resolved: string | null;
  try {
    resolved = rel(await realpath(link));
  } catch {
    resolved = null;
  }
  state.push({
    route: rel(link).replace("src/content/docs/", ""),
    isSymlink: true,
    exists: true,
    resolvesTo: resolved,
  });
}
found.push(...mirrorViolations(declared, state));

const owned = kept
  .filter((p) => p.startsWith(CONTENT + sep) && /\.(md|mdx)$/.test(p))
  .map((p) => routeOf(relative(CONTENT, p).split(sep).join("/")));
found.push(...collisionViolations(owned, declared));

// The error-code page claims to list every code lemonfiber can raise and no
// others. The crate emits its own list, so the claim is checked rather than
// maintained. A missing artefact is a violation: an unchecked-out submodule
// leaves the claim unverified, and silently unverified is what this replaces.
const text = async (path: string): Promise<string> => {
  try {
    return await readFile(join(ROOT, path), "utf8");
  } catch {
    return "";
  }
};
const errorCodes = await text("vendor/lemonfiber/reference/error-codes.md");

// The one dependency this repository pins to an exact revision, and the
// revision its lockfile resolved. `npm ci` re-resolves a git dependency rather
// than refusing the disagreement, so nothing else here would notice.
const declaredPin = await text("package.json");
const resolvedPin = await text("package-lock.json");

found.push(
  ...codeViolations(
    errorCodes,
    await text("src/content/docs/fixing/every-error-by-code.md"),
  ),
  ...lockViolations(declaredPin, resolvedPin),
);

// Every number the site states about a tree it does not own. The pages are
// this site's own prose only: a mirrored page is a symlink, and belongs to
// the repository it came from.
const prose: Page[] = [];
for (const path of kept.filter(
  (p) => p.startsWith(CONTENT + sep) && /\.(md|mdx)$/.test(p),
))
  prose.push({ path: rel(path), text: await readFile(path, "utf8") });

// This repository's own README states the same numbers in the same sentence
// shapes, and is read as one more page rather than as documentation about the
// pages. Its count of payload kinds sat outside every check while the contract
// left it behind.
prose.push({ path: "README.md", text: await text("README.md") });

const specPaths: string[] = [];
const specLinks: string[] = [];
await walk(join(ROOT, "vendor", "spec"), specPaths, specLinks);

// The formulae the tap serves. `brew install lemonfiber/tap/<name>` loads
// `Formula/<name>.rb` from that repository, so the file name is the name the
// pages print and the file's contents are the whole of what it installs.
const formulae: Formula[] = [];
for (const entry of await readdir(join(ROOT, FORMULAE)).catch(() => []))
  if (entry.endsWith(".rb"))
    formulae.push({
      name: entry.slice(0, -".rb".length),
      text: await text(`${FORMULAE}/${entry}`),
    });

found.push(
  ...formulaViolations(formulae, prose),
  ...countViolations(
    INVENTORIES,
    {
      stack: await text("vendor/lemonfiber-media-stack/stack.toml"),
      contract: await text("vendor/lemonfiber/contract/web-api.contract.json"),
      commands: await text("vendor/lemonfiber/reference/commands.md"),
      webApi: await text("vendor/spec/20-architecture/contracts/web-api.md"),
      mirrors: await text("mirrors.json"),
      clientIndex: await text("vendor/sdk-ts/src/index.ts"),
      phpContract: await text("vendor/sdk-php/contract/web-api.contract.json"),
      phpManifest: await text("vendor/sdk-php/composer.json"),
      tsContract: await text("vendor/sdk-ts/contract/web-api.contract.json"),
      webManifest: await text("vendor/lemonfiber-web/package.json"),
      spec: specPaths.map(rel),
    },
    prose,
  ),
  ...familyViolations(errorCodes, prose),
);

if (found.length > 0) {
  console.error(`guards: ${String(found.length)} violation(s)\n`);
  console.error(format(found));
  process.exit(1);
}
console.log(
  `guards: clean (${String(authored.length)} authored, ${String(state.length)} mirror(s), ${String(prose.length)} page(s))`,
);

#!/usr/bin/env node
/** Reads the tree and applies the rules in src/lib/guards.ts. */
import { readdir, readFile, realpath, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import {
  ARTEFACT,
  codeViolations,
  familyViolations,
  INDEX,
  isFamilyPage,
} from "../src/lib/codes.ts";
import {
  CLIENTS,
  contractViolations,
  SERVED,
  type Copy,
} from "../src/lib/contracts.ts";
import { countViolations, type Page } from "../src/lib/counts.ts";
import {
  formulaViolations,
  FORMULAE,
  type Formula,
} from "../src/lib/formula.ts";
import { HEALTH, healthViolations } from "../src/lib/health.ts";
import { INVENTORIES } from "../src/lib/inventories.ts";
import { lockViolations } from "../src/lib/lockfile.ts";
import {
  INSTALLED,
  STYLESHEET,
  TOKENS,
  tokenViolations,
} from "../src/lib/tokens.ts";
import {
  collisionViolations,
  fileViolations,
  format,
  mirrorViolations,
  routeOf,
  type Declared,
  type MirrorState,
  type SourceFile,
  type Fix,
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
  const below: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) links.push(path);
    else if (entry.isDirectory()) below.push(path);
    else files.push(path);
  }
  // Each directory below is walked into lists of its own, and those are added in
  // the order the directories were listed, so what is found does not depend on
  // which walk finished first.
  const walked = await Promise.all(
    below.map(async (path) => {
      const found = { files: [] as string[], links: [] as string[] };
      await walk(path, found.files, found.links);
      return found;
    }),
  );
  for (const found of walked) {
    files.push(...found.files);
    links.push(...found.links);
  }
}

const paths: string[] = [];
const links: string[] = [];
await walk(join(ROOT, "src"), paths, links);
await walk(join(ROOT, "scripts"), paths, links);

const kept = paths.filter((p) => !GENERATED.some((d) => p.includes(d)));
const authored = kept.filter((p) => !p.startsWith(CONTENT + sep));

/**
 * Refuse a list nothing is in, before anything is claimed about what is in it.
 *
 * Nearly every rule below is a claim about an absence — no page without a route,
 * no link that resolves nowhere, no count that disagrees with the thing counted
 * — and a claim about an absence is satisfied by having looked at nothing.
 *
 * `walk` swallows the error a missing directory raises, on purpose: several of
 * the trees it is pointed at are optional. What that makes silent is the tree
 * that is not optional having moved. The counts printed on success would show
 * it, and nobody reads a count on a green run.
 */
const readSomething = (what: string, how_many: number): void => {
  if (how_many === 0)
    found.push({
      where: what,
      line: null,
      message: "holds nothing, so every rule over it passed on nothing",
    });
};

const sources: SourceFile[] = await Promise.all(
  authored.map(async (path) => ({
    path: rel(path),
    text: await readFile(path, "utf8"),
  })),
);
const found: Violation[] = sources.flatMap((file) => fileViolations(file));

const manifest: unknown = JSON.parse(
  await readFile(join(ROOT, "mirrors.json"), "utf8"),
);
const declared = (manifest as { mirrors: Declared[] }).mirrors;

const state: MirrorState[] = await Promise.all(
  links
    .filter((l) => l.startsWith(CONTENT + sep))
    .map(async (link) => ({
      route: rel(link).replace("src/content/docs/", ""),
      isSymlink: true,
      exists: true,
      resolvesTo: await realpath(link).then(rel, () => null),
    })),
);
found.push(...mirrorViolations(declared, state));

readSomething("src", authored.length);
readSomething("src/content/docs", kept.length - authored.length);

// The community health files GitHub serves for every repository in the org.
// The mirror rule above catches a symlink pointing at a file that is not
// there; this catches the file that is there and no page renders.
const orgPaths: string[] = [];
const orgLinks: string[] = [];
await walk(join(ROOT, HEALTH), orgPaths, orgLinks);
found.push(...healthViolations(orgPaths.map(rel), declared));

const owned = kept
  .filter((p) => p.startsWith(CONTENT + sep) && /\.(md|mdx)$/.test(p))
  .map((p) => routeOf(relative(CONTENT, p).split(sep).join("/")));
found.push(...collisionViolations(owned, declared));

// The error-code pages claim to list every code lemonfiber can raise and no
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
const errorCodes = await text(ARTEFACT);

// The one dependency this repository pins to an exact revision, and the
// revision its lockfile resolved. `npm ci` re-resolves a git dependency rather
// than refusing the disagreement, so nothing else here would notice.
const declaredPin = await text("package.json");
const resolvedPin = await text("package-lock.json");

// The stylesheet against the brand tokens it renames. Brand arrives twice —
// the submodule the brand pages are rendered from, and the package the
// stylesheet imports — and the two are compared with each other as well.
found.push(
  ...tokenViolations(
    await text(TOKENS),
    await text(INSTALLED),
    await text(STYLESHEET),
  ),
  ...lockViolations(declaredPin, resolvedPin),
);

// Every number the site states about a tree it does not own. The pages are
// this site's own prose only: a mirrored page is a symlink, and belongs to
// the repository it came from.
const prose: Page[] = await Promise.all(
  kept
    .filter((p) => p.startsWith(CONTENT + sep) && /\.(md|mdx)$/.test(p))
    .map(async (path) => ({
      path: rel(path),
      text: await readFile(path, "utf8"),
    })),
);

// This repository's own README states the same numbers in the same sentence
// shapes, and is read as one more page rather than as documentation about the
// pages. Its count of payload kinds sat outside every check while the contract
// left it behind.
prose.push({ path: "README.md", text: await text("README.md") });

// The error-code pages: the index, and one page per family of codes.
found.push(
  ...codeViolations(errorCodes, await text(INDEX), prose.filter(isFamilyPage)),
);

const specPaths: string[] = [];
const specLinks: string[] = [];
await walk(join(ROOT, "vendor", "spec"), specPaths, specLinks);

// An unchecked-out submodule leaves this empty, and every rule reading the spec
// then passes on nothing — which is the same shape as the checked-out one being
// clean, and the reason the error-code page's claim is checked rather than
// maintained in the first place.
readSomething("vendor/spec", specPaths.length);

// The formulae the tap serves. `brew install lemonfiber/tap/<name>` loads
// `Formula/<name>.rb` from that repository, so the file name is the name the
// pages print and the file's contents are the whole of what it installs.
const formulae: Formula[] = await Promise.all(
  (await readdir(join(ROOT, FORMULAE)).catch(() => []))
    .filter((entry) => entry.endsWith(".rb"))
    .map(async (entry) => ({
      name: entry.slice(0, -".rb".length),
      text: await text(`${FORMULAE}/${entry}`),
    })),
);

// Each client generates its types from its own copy of the contract, and its
// page says how that copy stands against the artefact the pinned binary serves.
// The count of kinds on each page is held to that client's copy; the sentence
// comparing the two copies is held here.
const copies: Copy[] = await Promise.all(
  CLIENTS.map(async (client) => ({
    ...client,
    text: await text(client.source),
  })),
);

found.push(
  ...contractViolations(await text(SERVED), copies, prose),
  ...formulaViolations(formulae, prose),
  ...countViolations(
    INVENTORIES,
    {
      stack: await text("vendor/lemonfiber-media-stack/stack.toml"),
      contract: await text("vendor/lemonfiber/contract/web-api.contract.json"),
      commands: await text("vendor/lemonfiber/reference/commands.md"),
      quality: await text("vendor/lemonfiber/reference/commands/quality.md"),
      extensionPoints: await text(
        "vendor/lemonfiber/contract/extension-points.json",
      ),
      vocabulary: await text(
        "vendor/lemonfiber/contract/capability-vocabulary.json",
      ),
      webApi: await text("vendor/spec/20-architecture/contracts/web-api.md"),
      mirrors: await text("mirrors.json"),
      repos: await text("vendor/spec/30-repos/repos.toml"),
      clientIndex: await text("vendor/sdk-ts/src/index.ts"),
      phpContract: await text("vendor/sdk-php/contract/web-api.contract.json"),
      phpManifest: await text("vendor/sdk-php/composer.json"),
      tsContract: await text("vendor/sdk-ts/contract/web-api.contract.json"),
      webManifest: await text("vendor/lemonfiber-web/package.json"),
      webRoute: await text("vendor/lemonfiber-web/src/lib/route.ts"),
      manifests: await text("vendor/spec/70-operations/versions/README.md"),
      featureSchema: await text(
        "vendor/spec/10-functional/features/_meta/feature.schema.json",
      ),
      spec: specPaths.map(rel),
    },
    prose,
  ),
  ...familyViolations(errorCodes, prose),
);

/**
 * Write the corrections that have exactly one right answer.
 *
 * Applied last-first within each file so an earlier edit does not move a later
 * one's span, and the caller re-runs afterwards: a page may state the same count
 * twice, and one pass corrects each occurrence the pattern matched on that read.
 */
async function repair(violations: readonly Violation[]): Promise<number> {
  const byFile = new Map<string, Fix[]>();
  for (const violation of violations)
    if (violation.fix)
      byFile.set(violation.fix.path, [
        ...(byFile.get(violation.fix.path) ?? []),
        violation.fix,
      ]);

  const written = await Promise.all(
    [...byFile].map(async ([path, fixes]) => {
      let text = await readFile(path, "utf8");
      for (const fix of [...fixes].sort((a, b) => b.start - a.start))
        text = text.slice(0, fix.start) + fix.replacement + text.slice(fix.end);
      await writeFile(path, text, "utf8");
      return fixes.length;
    }),
  );
  return written.reduce((sum, one) => sum + one, 0);
}

if (found.length > 0) {
  if (process.argv.includes("--fix")) {
    const written = await repair(found);
    if (written > 0) {
      console.log(
        `guards: wrote ${String(written)} correction(s). Run again to confirm.`,
      );
      process.exit(0);
    }
    console.error(
      "guards: nothing here has a single correct answer, so none was written.\n",
    );
  }
  console.error(`guards: ${String(found.length)} violation(s)\n`);
  console.error(format(found));
  const fixable = found.filter((violation) => violation.fix).length;
  if (fixable > 0)
    console.error(
      `\n${String(fixable)} of these can be written by \`npm run guard -- --fix\`.`,
    );
  process.exit(1);
}
console.log(
  `guards: clean (${String(authored.length)} authored, ${String(state.length)} mirror(s), ${String(prose.length)} page(s))`,
);

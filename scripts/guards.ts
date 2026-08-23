#!/usr/bin/env node
/** Reads the tree and applies the rules in src/lib/guards.ts. */
import { readdir, readFile, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";

import {
  collisionViolations,
  fileViolations,
  format,
  mirrorViolations,
  routeOf,
  type Mirror,
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
const declared = (manifest as { mirrors: Mirror[] }).mirrors;

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

if (found.length > 0) {
  console.error(`guards: ${String(found.length)} violation(s)\n`);
  console.error(format(found));
  process.exit(1);
}
console.log(
  `guards: clean (${String(authored.length)} authored, ${String(state.length)} mirror(s))`,
);

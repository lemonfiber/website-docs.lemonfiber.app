#!/usr/bin/env node
/**
 * The kit's guards, and the rules only this site keeps: every number it states
 * about a tree it does not own, the error-code pages against the codes the
 * binary raises, the formulae the tap serves against the install pages, the
 * toolchain the workspace names against the page that tells a reader to build,
 * and every command line a page prints against the commands the binary declares.
 */
import { join } from "node:path";

import { empty, type Tree } from "@lemonfiber/website-kit/site";
import type { Violation } from "@lemonfiber/website-kit/guards";
import { runGuards } from "@lemonfiber/website-kit/run/guards";

import {
  ARTEFACT,
  codeViolations,
  familyViolations,
  INDEX,
  isFamilyPage,
} from "../src/lib/codes.ts";
import {
  commandsIn,
  commandViolations,
  REFERENCE,
} from "../src/lib/commands.ts";
import { assembledContract, CONTRACT_DIRECTORY } from "../src/lib/contract.ts";
import { countViolations, type Page } from "../src/lib/counts.ts";
import { readText } from "../src/lib/checkout.ts";
import {
  formulaViolations,
  FORMULAE,
  type Formula,
} from "../src/lib/formula.ts";
import { INVENTORIES } from "../src/lib/inventories.ts";
import { toolchainViolations, WORKSPACE } from "../src/lib/toolchain.ts";
import { topicViolations } from "../src/lib/topics.ts";

async function checks(tree: Tree): Promise<Violation[]> {
  const { text } = tree;

  // This repository's own README states the same numbers in the same sentence
  // shapes, so it is read as one more page of the site's own prose.
  const prose: Page[] = [
    ...tree.pages,
    { path: "README.md", text: await text("README.md") },
  ];

  // The error-code pages claim to list every code lemonfiber can raise and no
  // others; the crate emits its own list, so the claim is checked.
  const errorCodes = await text(ARTEFACT);

  // An unchecked-out submodule leaves this empty, and every rule reading the
  // spec would then pass on nothing.
  const spec = await tree.files("vendor/spec");

  // `brew install lemonfiber/tap/<name>` loads `Formula/<name>.rb`, so the file
  // name is the name the pages print and its contents are what it installs.
  const formulae: Formula[] = await Promise.all(
    (await tree.files(FORMULAE))
      .filter((path) => path.endsWith(".rb"))
      .map(async (path) => ({
        name: path.slice(FORMULAE.length + 1, -".rb".length),
        text: await text(path),
      })),
  );

  return [
    ...(spec.length === 0 ? [empty("vendor/spec")] : []),
    ...codeViolations(
      errorCodes,
      await text(INDEX),
      prose.filter(isFamilyPage),
    ),
    ...formulaViolations(formulae, prose),
    ...toolchainViolations(await text(WORKSPACE), prose),
    ...commandViolations(
      commandsIn(
        await Promise.all(
          (await tree.files(REFERENCE))
            .filter((path) => path.endsWith(".md"))
            .map((path) => text(path)),
        ),
      ),
      prose,
    ),
    ...countViolations(
      INVENTORIES,
      {
        stack: await text("vendor/lemonfiber-media-stack/stack.toml"),
        contract: JSON.stringify(
          assembledContract((file) =>
            readText(join(tree.root, CONTRACT_DIRECTORY, file)),
          ),
        ),
        commands: await text("vendor/lemonfiber/reference/commands.md"),
        quality: await text("vendor/lemonfiber/reference/commands/quality.md"),
        extensionPoints: await text(
          "vendor/lemonfiber/contract/extension-points.json",
        ),
        vocabulary: await text(
          "vendor/lemonfiber/contract/capability-vocabulary.json",
        ),
        webApi: await text("vendor/spec/20-architecture/contracts/web-api.md"),
        webRoute: await text("vendor/lemonfiber-web/src/lib/route.ts"),
        template: await text("vendor/plugin-template/plugin.toml"),
      },
      prose,
    ),
    ...familyViolations(errorCodes, prose),
    ...topicViolations(tree.pages),
  ];
}

await runGuards({ root: new URL("..", import.meta.url).pathname, checks });

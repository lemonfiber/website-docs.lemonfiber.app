#!/usr/bin/env node
/**
 * The kit's guards, and the rules only this site keeps: every number it states
 * about a tree it does not own, the error-code pages against the codes the
 * binary raises, and the formulae the tap serves against the install pages.
 */
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
import { countViolations, type Page } from "../src/lib/counts.ts";
import {
  formulaViolations,
  FORMULAE,
  type Formula,
} from "../src/lib/formula.ts";
import { INVENTORIES } from "../src/lib/inventories.ts";
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
    ...countViolations(
      INVENTORIES,
      {
        stack: await text("vendor/lemonfiber-media-stack/stack.toml"),
        contract: await text(
          "vendor/lemonfiber/contract/web-api.contract.json",
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
        manifests: await text("vendor/spec/70-operations/versions/README.md"),
        featureSchema: await text(
          "vendor/spec/10-functional/features/_meta/feature.schema.json",
        ),
        spec,
      },
      prose,
    ),
    ...familyViolations(errorCodes, prose),
    ...topicViolations(tree.pages),
  ];
}

await runGuards({ root: new URL("..", import.meta.url).pathname, checks });

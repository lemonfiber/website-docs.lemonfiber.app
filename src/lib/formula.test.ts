import { readdirSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  formulaViolations,
  FORMULAE,
  installed,
  versionIn,
  type Formula,
} from "./formula.ts";
import type { Page } from "./counts.ts";

const PLACEHOLDER = [
  "class Lemonfiber < Formula",
  '  desc "Self-hosted media automation stack, run in slices"',
  '  version "0.0.0"',
  "end",
].join("\n");

const formula = (name: string, text = PLACEHOLDER): Formula => ({ name, text });

const page = (
  text: string,
  path = "src/content/docs/start/install.md",
): Page => ({ path, text });

const SAYS = page(
  "Run `brew install lemonfiber/tap/lemonfiber`. It declares version `0.0.0`.",
);

describe("versionIn", () => {
  it("takes the version a formula declares", () => {
    expect(versionIn(PLACEHOLDER)).toBe("0.0.0");
  });

  it("finds none where a formula declares no version", () => {
    expect(versionIn("class Lemonfiber < Formula\nend\n")).toBeNull();
  });
});

describe("installed", () => {
  it("takes every name the pages tell a reader to install", () => {
    expect(
      installed([
        page("`brew install lemonfiber/tap/lemonfiber`"),
        page("brew install lemonfiber/tap/lemonfiber-nightly", "other.md"),
      ]),
    ).toEqual(["lemonfiber", "lemonfiber-nightly"]);
  });
});

describe("formulaViolations", () => {
  it("passes a tap the pages name and state the version of", () => {
    expect(formulaViolations([formula("lemonfiber")], [SAYS])).toEqual([]);
  });

  it("refuses an empty tap, rather than reading as clean", () => {
    expect(formulaViolations([], [SAYS])).toEqual([
      {
        where: FORMULAE,
        line: null,
        message: "no formula here — the tap is missing or unreadable",
      },
    ]);
  });

  it("refuses a formula declaring no version", () => {
    expect(
      formulaViolations(
        [formula("lemonfiber", "class Lemonfiber < Formula\nend\n")],
        [page("`brew install lemonfiber/tap/lemonfiber`")],
      ),
    ).toEqual([
      {
        where: `${FORMULAE}/lemonfiber.rb`,
        line: null,
        message: "declares no version, so there is nothing for a page to state",
      },
    ]);
  });

  it("names every formula no page tells a reader to install, in order", () => {
    expect(
      formulaViolations(
        [
          formula("lemonfiber"),
          formula("lemonfiber-nightly"),
          formula("lemonfiber-beta"),
        ],
        [SAYS],
      ),
    ).toEqual([
      {
        where: FORMULAE,
        line: null,
        message:
          "the tap serves these and no page tells a reader to install them: lemonfiber-beta, lemonfiber-nightly",
      },
    ]);
  });

  it("refuses an install the tap serves no formula for", () => {
    expect(
      formulaViolations(
        [formula("lemonfiber")],
        [SAYS, page("`brew install lemonfiber/tap/lemonfibre`", "typo.md")],
      ),
    ).toEqual([
      {
        where: FORMULAE,
        line: null,
        message:
          "a page installs these and the tap serves no formula by that name: lemonfibre",
      },
    ]);
  });

  it("refuses a page stating a version the tap does not declare", () => {
    expect(
      formulaViolations(
        [formula("lemonfiber", PLACEHOLDER.replace("0.0.0", "1.0.0"))],
        [SAYS],
      ),
    ).toEqual([
      {
        where: "src/content/docs/start/install.md",
        line: null,
        message: "says the formula declares 0.0.0 where the tap declares 1.0.0",
      },
    ]);
  });

  it("refuses a rewording that left no page saying which version", () => {
    expect(
      formulaViolations(
        [formula("lemonfiber")],
        [page("`brew install lemonfiber/tap/lemonfiber` gets you nothing.")],
      ),
    ).toEqual([
      {
        where: FORMULAE,
        line: null,
        message:
          "no page says which version the tap's formula declares — a rewording left this watching nothing",
      },
    ]);
  });

  it("asks for no statement where no formula declares a version", () => {
    expect(
      formulaViolations(
        [formula("lemonfiber", "class Lemonfiber < Formula\nend\n")],
        [page("`brew install lemonfiber/tap/lemonfiber`")],
      ).map((one) => one.message),
    ).toEqual(["declares no version, so there is nothing for a page to state"]);
  });

  it("holds this site's pages to the tap this repository pins", () => {
    const formulae = readdirSync(FORMULAE)
      .filter((entry) => entry.endsWith(".rb"))
      .map((entry) => ({
        name: entry.slice(0, -".rb".length),
        text: readFileSync(`${FORMULAE}/${entry}`, "utf8"),
      }));
    const pages = [
      {
        path: "src/content/docs/start/install.md",
        text: readFileSync("src/content/docs/start/install.md", "utf8"),
      },
    ];

    expect(formulaViolations(formulae, pages)).toEqual([]);
  });
});

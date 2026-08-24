import { describe, expect, it } from "vitest";

import {
  codesInArtefact,
  codesOnPage,
  codeViolations,
  familySizes,
  familyViolations,
} from "./codes.ts";
import type { Page } from "./counts.ts";

/** The generated reference: a heading, a sentence, then one bullet per code. */
const artefact = (...codes: string[]): string =>
  [
    "# `lemonfiber` — error codes",
    "",
    "Generated from the codes the crates declare.",
    "",
    ...codes.map((code) => `- \`${code}\``),
    "",
  ].join("\n");

/** A code table on the page, as the page writes them. */
const table = (...codes: string[]): string =>
  [
    "| Code | What it means | What to do |",
    "| ---- | ------------- | ---------- |",
    ...codes.map((code) => `| \`${code}\` | It happened. | Do the thing. |`),
    "",
  ].join("\n");

describe("codesInArtefact", () => {
  it("reads every bullet the reference lists", () => {
    expect(codesInArtefact(artefact("ACK-1", "VPN-2", "STACK-10"))).toEqual([
      "ACK-1",
      "VPN-2",
      "STACK-10",
    ]);
  });

  it("reads nothing out of prose that lists none", () => {
    expect(
      codesInArtefact("# A heading\n\nSome prose about `VPN-1`.\n"),
    ).toEqual([]);
  });

  it("reads nothing out of a bullet that carries more than a code", () => {
    expect(codesInArtefact("- `VPN-1` and something else\n")).toEqual([]);
  });
});

describe("codesOnPage", () => {
  it("reads the first cell of every code row", () => {
    expect(codesOnPage(table("SETUP-1", "CONFIG-2"))).toEqual([
      "SETUP-1",
      "CONFIG-2",
    ]);
  });

  it("leaves the tables that are not code tables alone", () => {
    const page = [
      table("SETUP-1"),
      "| Severity | What it means |",
      "| -------- | ------------- |",
      "| `advisory` | Worth knowing. |",
      "| `actionable` | Do something. |",
      "",
      "| Exit code | Meaning |",
      "| --------- | ------- |",
      "| `0` | It worked. |",
      "| `1` | It did not. |",
      "",
    ].join("\n");
    expect(codesOnPage(page)).toEqual(["SETUP-1"]);
  });

  it("reads nothing out of a mention of a code in prose", () => {
    expect(
      codesOnPage("A code looks like `VPN-1`: a family, then a number.\n"),
    ).toEqual([]);
  });
});

describe("codeViolations", () => {
  it("finds nothing when the two lists agree", () => {
    expect(
      codeViolations(artefact("SETUP-1", "VPN-2"), table("SETUP-1", "VPN-2")),
    ).toEqual([]);
  });

  it("finds nothing when they agree in a different order", () => {
    expect(
      codeViolations(artefact("VPN-2", "SETUP-1"), table("SETUP-1", "VPN-2")),
    ).toEqual([]);
  });

  it("names a code lemonfiber raises that the page does not document", () => {
    const [found, ...rest] = codeViolations(
      artefact("SETUP-1", "VPN-2"),
      table("SETUP-1"),
    );
    expect(rest).toEqual([]);
    expect(found?.where).toBe("src/content/docs/fixing/every-error-by-code.md");
    expect(found?.message).toContain("VPN-2");
    expect(found?.message).toContain("does not");
  });

  it("names a code the page documents that lemonfiber cannot raise", () => {
    const [found, ...rest] = codeViolations(
      artefact("SETUP-1"),
      table("SETUP-1", "GHOST-9"),
    );
    expect(rest).toEqual([]);
    expect(found?.message).toContain("GHOST-9");
    expect(found?.message).toContain("cannot raise");
  });

  it("reports both directions at once, each code named", () => {
    const found = codeViolations(
      artefact("SETUP-1", "VPN-2"),
      table("SETUP-1", "GHOST-9"),
    );
    expect(found).toHaveLength(2);
    expect(found.map((one) => one.message).join(" ")).toContain("VPN-2");
    expect(found.map((one) => one.message).join(" ")).toContain("GHOST-9");
  });

  it("sorts the codes it names, so a report reads the same twice", () => {
    const [found] = codeViolations(
      artefact("VPN-2", "ACK-1", "SETUP-1"),
      table("SETUP-1"),
    );
    expect(found?.message).toContain("ACK-1, VPN-2");
  });

  it("refuses an empty reference rather than agreeing with it", () => {
    const [found, ...rest] = codeViolations("", table("SETUP-1"));
    expect(rest).toEqual([]);
    expect(found?.where).toBe("vendor/lemonfiber/reference/error-codes.md");
    expect(found?.message).toContain("no error codes found");
    expect(found?.line).toBeNull();
  });

  it("refuses an empty reference even when the page is empty too", () => {
    expect(codeViolations("", "")).toHaveLength(1);
  });
});

/** A page that sends the reader to the code page for one family. */
const sends = (text: string): Page[] => [
  { path: "src/content/docs/fixing/a-page.md", text },
];

describe("familySizes", () => {
  it("counts the codes in each family the reference declares", () => {
    expect([
      ...familySizes(artefact("VPN-1", "VPN-2", "STORAGE-1")).entries(),
    ]).toEqual([
      ["VPN", 2],
      ["STORAGE", 1],
    ]);
  });
});

describe("familyViolations", () => {
  it("finds nothing when the sentence and the reference agree", () => {
    expect(
      familyViolations(
        artefact("VPN-1", "VPN-2"),
        sends("See the two `VPN` codes, side by side."),
      ),
    ).toEqual([]);
  });

  it("names the page, the line and both numbers when they disagree", () => {
    const [found, ...rest] = familyViolations(
      artefact("VPN-1", "VPN-2", "VPN-3"),
      sends("A heading\n\nSee the two `VPN` codes, side by side.\n"),
    );
    expect(rest).toEqual([]);
    expect(found?.where).toBe("src/content/docs/fixing/a-page.md");
    expect(found?.line).toBe(3);
    expect(found?.message).toContain("says two `VPN` codes");
    expect(found?.message).toContain("three");
  });

  it("leaves a family the reference does not declare alone", () => {
    expect(
      familyViolations(
        artefact("VPN-1", "VPN-2"),
        sends("See the two `VPN` codes, and the four `HTTP` codes."),
      ),
    ).toEqual([]);
  });

  it("refuses a reference with no codes in it", () => {
    const [found, ...rest] = familyViolations("", sends("the two `VPN` codes"));
    expect(rest).toEqual([]);
    expect(found?.where).toBe("vendor/lemonfiber/reference/error-codes.md");
    expect(found?.message).toContain("no error codes found");
  });

  it("refuses a site where no sentence says how big a family is", () => {
    const [found, ...rest] = familyViolations(
      artefact("VPN-1"),
      sends("The VPN checks are over here."),
    );
    expect(rest).toEqual([]);
    expect(found?.message).toContain("no sentence says how many codes");
  });
});

import { describe, expect, it } from "vitest";

import {
  asNumber,
  countViolations,
  inWords,
  matches,
  type Inventory,
  type Page,
  type Sources,
} from "./counts.ts";

const nothing: Sources = {
  stack: "",
  contract: "",
  commands: "",
  webApi: "",
  mirrors: "",
  clientIndex: "",
  webManifest: "",
  spec: [],
};

const page = (text: string, path = "src/content/docs/a-page.md"): Page => ({
  path,
  text,
});

/** Three widgets, stated one way, on one page. */
const widgets = (over: Partial<Inventory> = {}): Inventory[] => [
  {
    what: "widgets",
    source: "vendor/widgets.toml",
    members: () => ["one", "two", "three"],
    claims: [{ says: "the %N% widgets" }],
    ...over,
  },
];

const against = (
  inventories: readonly Inventory[],
  pages: readonly Page[],
  sources: Sources = nothing,
) => countViolations(inventories, sources, pages);

describe("inWords", () => {
  it("spells the numbers prose spells", () => {
    expect([0, 6, 9, 15, 19, 20, 25, 68, 99].map(inWords)).toEqual([
      "zero",
      "six",
      "nine",
      "fifteen",
      "nineteen",
      "twenty",
      "twenty-five",
      "sixty-eight",
      "ninety-nine",
    ]);
  });

  it("writes digits past the point prose would spell it", () => {
    expect(inWords(140)).toBe("140");
  });
});

describe("asNumber", () => {
  it("reads a number a sentence spelled", () => {
    expect(asNumber("nineteen")).toBe(19);
  });

  it("reads one a sentence began with a capital", () => {
    expect(asNumber("Sixty-eight")).toBe(68);
  });

  it("reads one a sentence wrote in digits", () => {
    expect(asNumber("42")).toBe(42);
  });
});

describe("matches", () => {
  it("collects every first capture", () => {
    expect(matches(/<(\w+)>/g, "<a> and <b>")).toEqual(["a", "b"]);
  });
});

describe("countViolations", () => {
  it("finds nothing when the sentence and the source agree", () => {
    expect(against(widgets(), [page("It ships the three widgets.")])).toEqual(
      [],
    );
  });

  it("names the page, the line and both numbers when they disagree", () => {
    const [found, ...rest] = against(widgets(), [
      page("A heading\n\nIt ships the four widgets.\n"),
    ]);
    expect(rest).toEqual([]);
    expect(found?.where).toBe("src/content/docs/a-page.md");
    expect(found?.line).toBe(3);
    expect(found?.message).toContain("says four");
    expect(found?.message).toContain("three widgets");
  });

  it("reads a number the page wrote in digits", () => {
    expect(against(widgets(), [page("It ships the 3 widgets.")])).toEqual([]);
  });

  it("reads a sentence that wrapped between the number and the noun", () => {
    expect(against(widgets(), [page("It ships the\nthree widgets.")])).toEqual(
      [],
    );
  });

  it("counts what the sentence adds to the count", () => {
    expect(
      against(widgets({ claims: [{ says: "making it %N%", plus: 1 }] }), [
        page("Adding one is making it four."),
      ]),
    ).toEqual([]);
  });

  it("refuses a source with nothing in it rather than agreeing with it", () => {
    const [found, ...rest] = against(widgets({ members: () => [] }), [
      page("It ships the three widgets."),
    ]);
    expect(rest).toEqual([]);
    expect(found?.where).toBe("vendor/widgets.toml");
    expect(found?.line).toBeNull();
    expect(found?.message).toContain("no widgets found");
  });

  it("refuses a claim no sentence states any more", () => {
    const [found, ...rest] = against(widgets(), [
      page("It ships a good number of widgets."),
    ]);
    expect(rest).toEqual([]);
    expect(found?.message).toContain("nothing states the number of widgets");
    expect(found?.message).toContain("the %N% widgets");
  });

  it("checks every page, not the first one that states it", () => {
    const found = against(widgets(), [
      page("It ships the three widgets.", "src/content/docs/one.md"),
      page("It ships the five widgets.", "src/content/docs/two.md"),
    ]);
    expect(found).toHaveLength(1);
    expect(found[0]?.where).toBe("src/content/docs/two.md");
  });

  it("checks every claim a page could state the count in", () => {
    const found = against(
      widgets({
        claims: [{ says: "the %N% widgets" }, { says: "%N% of them" }],
      }),
      [page("It ships the three widgets, and uses five of them.")],
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.message).toContain("says five");
  });
});

describe("countViolations, against a page that lists them", () => {
  const listed = (over: Partial<Inventory> = {}): Inventory[] =>
    widgets({
      claims: [],
      listing: {
        page: "src/content/docs/list.md",
        members: (text) => matches(/^- (\w+)$/gm, text),
      },
      ...over,
    });

  it("finds nothing when the page lists exactly what the source has", () => {
    expect(
      against(listed(), [
        page("- one\n- two\n- three\n", "src/content/docs/list.md"),
      ]),
    ).toEqual([]);
  });

  it("names what the source has and the page leaves out", () => {
    const [found, ...rest] = against(listed(), [
      page("- one\n- two\n", "src/content/docs/list.md"),
    ]);
    expect(rest).toEqual([]);
    expect(found?.where).toBe("src/content/docs/list.md");
    expect(found?.message).toContain("three");
    expect(found?.message).toContain("the page does not");
  });

  it("names what the page has and the source does not", () => {
    const [found, ...rest] = against(listed(), [
      page("- one\n- two\n- three\n- four\n", "src/content/docs/list.md"),
    ]);
    expect(rest).toEqual([]);
    expect(found?.message).toContain("four");
    expect(found?.message).toContain("does not");
  });

  it("sorts the names it reports, so a report reads the same twice", () => {
    const [found] = against(listed(), [
      page("- one\n", "src/content/docs/list.md"),
    ]);
    expect(found?.message).toContain("three, two");
  });

  it("reports both directions at once", () => {
    expect(
      against(listed(), [
        page("- one\n- two\n- nine\n", "src/content/docs/list.md"),
      ]),
    ).toHaveLength(2);
  });

  it("refuses a listing page that is not in the tree", () => {
    const [found, ...rest] = against(listed(), []);
    expect(rest).toEqual([]);
    expect(found?.where).toBe("src/content/docs/list.md");
    expect(found?.message).toContain("is not here");
  });
});

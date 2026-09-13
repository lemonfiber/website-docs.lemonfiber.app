import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  allowed,
  PILL,
  rendered,
  SCHEMA,
  undrawable,
  unreachable,
} from "./maturity.ts";

const read = (path: string): string => readFileSync(path, "utf8");

/** A schema of the shape the catalogue's own is, with a maturity nobody drew. */
const schema = (...values: string[]): string =>
  JSON.stringify({ properties: { maturity: { enum: values } } });

/** The component's shape: a label map, then a stylesheet naming the same words. */
const component = (...values: string[]): string =>
  [
    "const LABEL: Record<string, () => string> = {",
    ...values.map((one) => `  ${one}: m.maturity_${one},`),
    "};",
    "",
    "<style>",
    "  .mpill--shipped { color: var(--text); }",
    "  .mpill--nothing-has-this-label { color: red; }",
    "</style>",
  ].join("\n");

describe("what the component can draw", () => {
  it("reads the label map and not the stylesheet under it", () => {
    // A maturity with a colour and no word is the case this exists to catch, so
    // a reader that took the whole file would report it as drawable.
    expect(rendered(component("shipped", "planned"))).toEqual([
      "shipped",
      "planned",
    ]);
  });

  it("reads nothing from a component with no label map", () => {
    expect(rendered("<span>{maturity}</span>")).toEqual([]);
  });

  it("reads nothing from a label map that was never closed", () => {
    expect(rendered("const LABEL = {\n  shipped: m.maturity_shipped,")).toEqual(
      [],
    );
  });
});

describe("what the catalogue allows", () => {
  it("is the maturity enum of the frontmatter schema", () => {
    expect(allowed(schema("planned", "built"))).toEqual(["planned", "built"]);
  });

  it("is empty where the schema does not parse", () => {
    expect(allowed("not json")).toEqual([]);
  });
});

describe("the two lists against each other", () => {
  it("names a maturity the catalogue allows and the site cannot draw", () => {
    // The live defect, reduced: `built` joined the enum and the pill kept four
    // labels, so every finished feature was drawn as not started.
    expect(
      undrawable(
        schema("planned", "building", "built", "shipped", "withdrawn"),
        component("shipped", "building", "planned", "withdrawn"),
      ),
    ).toEqual(["built"]);
  });

  it("names a label the catalogue no longer has a maturity for", () => {
    expect(
      unreachable(schema("planned"), component("planned", "abandoned")),
    ).toEqual(["abandoned"]);
  });

  it("finds nothing when the two agree", () => {
    const both = schema("planned", "shipped");
    expect(undrawable(both, component("planned", "shipped"))).toEqual([]);
    expect(unreachable(both, component("planned", "shipped"))).toEqual([]);
  });
});

describe("this repository as it stands", () => {
  it("has a label for every maturity the pinned catalogue allows", () => {
    // The claim, against the artefacts that ship rather than against fixtures.
    // Asserted before the comparison below, because a reader of zero files
    // finds zero disagreements and reports a clean run.
    expect(allowed(read(SCHEMA)).length).toBeGreaterThan(3);
    expect(rendered(read(PILL)).length).toBeGreaterThan(3);
    expect(undrawable(read(SCHEMA), read(PILL))).toEqual([]);
  });

  it("carries no label for a maturity the catalogue has dropped", () => {
    expect(unreachable(read(SCHEMA), read(PILL))).toEqual([]);
  });
});

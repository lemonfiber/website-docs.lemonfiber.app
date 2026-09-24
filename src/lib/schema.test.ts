import { readFileSync } from "node:fs";

import { artefact, vendored } from "./schema-source";
import {
  definitionOf,
  fieldsOf,
  parsedJson,
  payloads,
  standalone,
  typeOf,
  variantOf,
  type Definition,
  type Token,
} from "./schema";

const json = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown;

/** A type written out plainly, so an expectation reads as the page would. */
const spoken = (tokens: readonly Token[]): string =>
  tokens
    .map((token) => {
      switch (token.kind) {
        case "ref":
          return `<${token.name}>`;
        case "primitive":
          return token.name;
        case "const":
          return token.value;
        case "bound":
          return `(${token.text})`;
        case "word":
          return `_${token.word}_`;
      }
    })
    .join(" ");

describe("typeOf", () => {
  it.each([
    [{ $ref: "#/$defs/Held" }, "<Held>"],
    [{ type: "string", const: "held" }, '"held"'],
    [{ const: 3 }, "3"],
    [{ enum: ["a", "b"] }, '"a" _or_ "b"'],
    [{ anyOf: [{ $ref: "#/$defs/X" }, { type: "null" }] }, "<X> _or_ null"],
    [
      { oneOf: [{ type: "string" }, { type: "integer" }] },
      "string _or_ integer",
    ],
    [{ type: ["string", "null"] }, "string _or_ null"],
    [{ type: "array", items: { $ref: "#/$defs/Wired" } }, "_arrayOf_ <Wired>"],
    [{ type: "array" }, "_arrayOf_ _any_"],
    [
      { type: "object", additionalProperties: { type: "boolean" } },
      "_mapOf_ boolean",
    ],
    [{ type: "object" }, "object"],
    [
      { type: "integer", format: "uint16", minimum: 0, maximum: 65535 },
      "integer (uint16, ≥ 0, ≤ 65535)",
    ],
    [{ type: "integer", minimum: 1 }, "integer (≥ 1)"],
    [{}, "_any_"],
    [{ $ref: "other.json#/x" }, "_any_"],
    [{ const: true }, "_any_"],
  ])("writes %j as %s", (node, expected) => {
    expect(spoken(typeOf(node))).toBe(expected);
  });
});

describe("fieldsOf", () => {
  it("keeps the schema's order, and says which are required", () => {
    const fields = fieldsOf({
      properties: {
        id: { type: "string", description: "Who." },
        year: { type: ["integer", "null"] },
        broken: "not a schema",
      },
      required: ["id"],
    });
    expect(fields).toEqual([
      {
        name: "id",
        required: true,
        description: "Who.",
        type: [{ kind: "primitive", name: "string" }],
      },
      {
        name: "year",
        required: false,
        description: "",
        type: [
          { kind: "primitive", name: "integer" },
          { kind: "word", word: "or" },
          { kind: "primitive", name: "null" },
        ],
      },
    ]);
  });

  it("finds nothing on a node that is not an object", () => {
    expect(fieldsOf({ type: "string" })).toEqual([]);
  });
});

describe("variantOf", () => {
  it("reads a bare constant", () => {
    expect(
      variantOf({ type: "string", const: "lan", description: "The network." }),
    ).toEqual({
      tag: "",
      value: "lan",
      description: "The network.",
      fields: [],
      type: [],
    });
  });

  it("reads a tagged object, leaving the tag out of its fields", () => {
    const variant = variantOf({
      properties: {
        settled: { type: "string", const: "contested" },
        claimants: { type: "array", items: { type: "string" } },
      },
      required: ["settled", "claimants"],
    });
    expect(variant.tag).toBe("settled");
    expect(variant.value).toBe("contested");
    expect(variant.fields.map((field) => field.name)).toEqual(["claimants"]);
  });

  it("reads an object no constant tells apart", () => {
    const variant = variantOf({ properties: { at: { type: "string" } } });
    expect([variant.tag, variant.value]).toEqual(["", ""]);
    expect(variant.fields).toHaveLength(1);
  });

  it("reads a branch that is some other type", () => {
    expect(spoken(variantOf({ $ref: "#/$defs/Other" }).type)).toBe("<Other>");
  });
});

describe("definitionOf", () => {
  it("reads a choice", () => {
    const choice = definitionOf("Bind", {
      oneOf: [{ const: "loopback" }, { const: "lan" }],
    });
    expect(choice.variants.map((one) => one.value)).toEqual([
      "loopback",
      "lan",
    ]);
    expect(choice.fields).toEqual([]);
  });

  it("reads an object", () => {
    expect(
      definitionOf("Held", { properties: { id: { type: "string" } } }).fields,
    ).toHaveLength(1);
  });

  it("reads an alias", () => {
    expect(spoken(definitionOf("Id", { type: "string" }).type)).toBe("string");
  });
});

describe("payloads", () => {
  const kind = (data: object, defs: object): object => ({
    properties: { data },
    $defs: defs,
  });

  it("merges the definitions every kind repeats", () => {
    const read = payloads({
      kinds: {
        wiring: kind(
          { $ref: "#/$defs/WiringReport" },
          { WiringReport: { type: "object" }, Shared: { type: "string" } },
        ),
        held: kind(
          { $ref: "#/$defs/HeldReport" },
          { HeldReport: { type: "object" }, Shared: { type: "string" } },
        ),
        start: { properties: { data: { type: "string" } } },
      },
    });
    expect(read.kinds.map((one) => one.name)).toEqual([
      "held",
      "start",
      "wiring",
    ]);
    expect(read.definitions.map((one) => one.name)).toEqual([
      "HeldReport",
      "Shared",
      "WiringReport",
    ]);
    expect(read.disagreeing).toEqual([]);
  });

  it("reports a name two kinds define differently", () => {
    const read = payloads({
      kinds: {
        a: kind({}, { Twin: { type: "string" }, Same: { type: "string" } }),
        b: kind({}, { Twin: { type: "null" }, Same: { type: "integer" } }),
      },
    });
    expect(read.disagreeing).toEqual(["Same", "Twin"]);
  });

  it("passes over what is not a schema", () => {
    const read = payloads({
      kinds: { odd: "no", bare: {}, half: { $defs: { X: "no" } } },
    });
    expect(read.kinds.map((one) => one.name)).toEqual(["bare", "half"]);
    expect(read.definitions).toEqual([]);
  });

  it("reads nothing out of something that is not a contract", () => {
    expect(payloads(null)).toEqual({
      kinds: [],
      definitions: [],
      disagreeing: [],
    });
  });
});

describe("standalone", () => {
  it("puts the root first, named by its title", () => {
    const read = standalone({
      title: "PluginManifest",
      properties: { plugin: { $ref: "#/$defs/Plugin" } },
      $defs: { Plugin: { type: "object" }, Bind: { oneOf: [] }, bad: 1 },
    });
    expect(read.map((one) => one.name)).toEqual([
      "PluginManifest",
      "Bind",
      "Plugin",
    ]);
  });

  it("reads nothing out of something that is not a schema", () => {
    expect(standalone([])).toEqual([]);
    expect(standalone({ title: "Bare" })).toHaveLength(1);
  });
});

describe("parsedJson", () => {
  it("parses, and gives nothing back for what is not JSON or not there", () => {
    expect(parsedJson('{"a":1}')).toEqual({ a: 1 });
    expect(parsedJson("{")).toBeNull();
    expect(parsedJson(null)).toBeNull();
  });
});

/** Every definition a token list names, however deep. */
const named = (definitions: readonly Definition[]): string[] =>
  definitions.flatMap((one) =>
    [
      ...one.type,
      ...one.fields.flatMap((field) => field.type),
      ...one.variants.flatMap((variant) => [
        ...variant.type,
        ...variant.fields.flatMap((field) => field.type),
      ]),
    ].flatMap((token) => (token.kind === "ref" ? [token.name] : [])),
  );

describe("the artefacts this site pins", () => {
  it("reads the web-API contract without a disagreement or a dangling name", () => {
    const read = payloads(artefact("web-api.contract.json"));
    const defined = new Set(read.definitions.map((one) => one.name));
    expect(read.disagreeing).toEqual([]);
    expect(read.kinds.length).toBeGreaterThan(0);
    expect(
      named(read.definitions).filter((name) => !defined.has(name)),
    ).toEqual([]);
  });

  it("reads the plugin manifest's schema, root first", () => {
    const read = standalone(
      json("vendor/lemonfiber/contract/plugin-manifest.schema.json"),
    );
    const defined = new Set(read.map((one) => one.name));
    expect(read[0]?.name).toBe("PluginManifest");
    expect(named(read).filter((name) => !defined.has(name))).toEqual([]);
  });

  it("reads a pinned file as text, and nothing where the checkout lacks it", () => {
    expect(vendored("plugin-template/plugin.toml")).toContain("[plugin]");
    expect(vendored("nowhere/at/all")).toBe("");
  });
});

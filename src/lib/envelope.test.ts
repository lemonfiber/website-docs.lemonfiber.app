import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { assembledContract, CONTRACT_DIRECTORY } from "./contract.ts";
import { envelopeOf } from "./envelope.ts";

const root = (data: object, extra: object = {}) => ({
  type: "object",
  properties: {
    api_version: { description: "The version.", type: "integer" },
    data: { description: "The payload.", ...data },
    ...extra,
  },
  required: ["api_version", "data"],
});

describe("envelopeOf", () => {
  it("reads the fields every kind declares alike, typed where they agree", () => {
    const fields = envelopeOf({
      kinds: {
        one: root({ $ref: "#/$defs/One" }, { host: { type: "string" } }),
        two: root({ $ref: "#/$defs/Two" }),
      },
    });
    expect(fields).toEqual([
      {
        name: "api_version",
        required: true,
        description: "The version.",
        type: [{ kind: "primitive", name: "integer" }],
      },
      { name: "data", required: true, description: "The payload.", type: null },
    ]);
  });

  it("leaves out a field the kinds describe differently", () => {
    const fields = envelopeOf({
      kinds: {
        one: root({ type: "object" }),
        two: { ...root({ type: "object" }), required: ["api_version"] },
      },
    });
    expect(fields.map((field) => field.name)).toEqual(["api_version"]);
  });

  it("leaves out a field whose meaning differs between kinds", () => {
    const two = root({ type: "object" });
    const fields = envelopeOf({
      kinds: {
        one: root({ type: "object" }),
        two: {
          ...two,
          properties: {
            ...two.properties,
            api_version: { description: "Another.", type: "integer" },
          },
        },
      },
    });
    expect(fields.map((field) => field.name)).toEqual(["data"]);
  });

  it("types a field only by the same field in every other kind", () => {
    const host = { host: { description: "Where.", type: "string" } };
    const fields = envelopeOf({
      kinds: {
        one: root({ type: "string" }, host),
        two: root({ $ref: "#/$defs/Two" }, host),
      },
    });
    expect(fields.find((field) => field.name === "data")?.type).toBeNull();
  });

  it("reads only the kinds that are schemas", () => {
    expect(
      envelopeOf({ kinds: { one: root({ type: "object" }), bad: 1 } }),
    ).toHaveLength(2);
    expect(envelopeOf({ kinds: [root({ type: "object" })] })).toEqual([]);
  });

  it("reads nothing from a contract with no kind", () => {
    expect(envelopeOf({})).toEqual([]);
    expect(envelopeOf(null)).toEqual([]);
    expect(envelopeOf({ kinds: { bad: 1 } })).toEqual([]);
  });

  it("reads the envelope of the contract the pinned core publishes", () => {
    const contract = assembledContract((file) =>
      readFileSync(`${CONTRACT_DIRECTORY}/${file}`, "utf8"),
    );
    expect(envelopeOf(contract).map((field) => field.name)).toEqual(
      expect.arrayContaining(["api_version", "kind", "data"]),
    );
  });
});

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { assembledContract, CONTRACT_DIRECTORY } from "./contract.ts";
import { kindDefinitions, kindSummaries } from "./kinds.ts";
import {
  payloads,
  type Definition,
  type Payloads,
  type Token,
} from "./schema.ts";

const ref = (name: string): Token => ({ kind: "ref", name });

const definition = (
  name: string,
  parts: Partial<Definition> = {},
): Definition => ({
  name,
  description: "",
  fields: [],
  variants: [],
  type: [],
  ...parts,
});

const field = (name: string, type: Token[]) => ({
  name,
  required: true,
  description: "",
  type,
});

const READ: Payloads = {
  kinds: [
    { name: "report", data: [ref("Report")] },
    { name: "line", data: [{ kind: "primitive", name: "string" }] },
  ],
  definitions: [
    definition("Report", {
      description: "What a run came to.\n\nAnd more besides.",
      fields: [field("level", [ref("Level")]), field("cause", [ref("Report")])],
    }),
    definition("Level", { type: [ref("Alias")] }),
    definition("Alias", {
      variants: [
        {
          tag: "kind",
          value: "x",
          description: "",
          fields: [field("inner", [ref("Inner")])],
          type: [ref("Bare")],
        },
      ],
    }),
    definition("Inner"),
    definition("Bare"),
    definition("Unused"),
  ],
  disagreeing: [],
};

describe("kindDefinitions", () => {
  it("reads the kind's data type, then everything it reaches, each once", () => {
    expect(kindDefinitions(READ, "report").map((one) => one.name)).toEqual([
      "Report",
      "Level",
      "Alias",
      "Bare",
      "Inner",
    ]);
  });

  it("reads nothing for a kind with no definition, or none at all", () => {
    expect(kindDefinitions(READ, "line")).toEqual([]);
    expect(kindDefinitions(READ, "missing")).toEqual([]);
  });

  it("skips a name the contract does not define", () => {
    const read: Payloads = {
      ...READ,
      kinds: [{ name: "odd", data: [ref("Nowhere"), ref("Inner")] }],
    };
    expect(kindDefinitions(read, "odd").map((one) => one.name)).toEqual([
      "Inner",
    ]);
  });

  it("reads a kind out of the contract the pinned core publishes", () => {
    const read = payloads(
      assembledContract((file) =>
        readFileSync(`${CONTRACT_DIRECTORY}/${file}`, "utf8"),
      ),
    );
    expect(kindDefinitions(read, "error")[0]?.name).toBe("Problem");
  });
});

describe("kindSummaries", () => {
  it("names each kind with the first paragraph its data type says", () => {
    expect(kindSummaries(READ)).toEqual([
      { name: "report", summary: "What a run came to." },
      { name: "line", summary: "" },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { assembledContract } from "./contract.ts";

/** A contract directory, as the files it holds. */
const directory =
  (files: Record<string, unknown>) =>
  (file: string): string | null =>
    file in files ? JSON.stringify(files[file]) : null;

const INDEX = {
  api_version: 1,
  key_callable: "key-callable.json",
  kinds: { doctor: "kinds/doctor.json", bare: "kinds/bare.json" },
  reads: "reads.json",
  refusals: "refusals.json",
};

describe("assembledContract", () => {
  it("gives each kind every definition it reaches, however deep, as #/$defs", () => {
    const read = directory({
      "index.json": INDEX,
      "key-callable.json": [{ action: "restart" }],
      "reads.json": [{ path: "/api/doctor" }],
      "refusals.json": { "ASK-12": "once" },
      "kinds/doctor.json": {
        $schema: "s",
        properties: { data: { $ref: "../defs/Report.json" } },
      },
      "kinds/bare.json": { type: "object" },
      "defs/Report.json": {
        $schema: "s",
        properties: {
          overall: { $ref: "Overall.json" },
          findings: { items: [{ $ref: "Finding.json" }] },
          self: { $ref: "#/properties/overall" },
          elsewhere: { $ref: "elsewhere.yaml" },
        },
      },
      "defs/Overall.json": { $schema: "s", oneOf: [{ const: "healthy" }] },
      "defs/Finding.json": { properties: { report: { $ref: "Report.json" } } },
    });

    expect(assembledContract(read)).toEqual({
      api_version: 1,
      key_callable: [{ action: "restart" }],
      kinds: {
        doctor: {
          $schema: "s",
          properties: { data: { $ref: "#/$defs/Report" } },
          $defs: {
            Finding: {
              properties: { report: { $ref: "#/$defs/Report" } },
            },
            Overall: { oneOf: [{ const: "healthy" }] },
            Report: {
              properties: {
                overall: { $ref: "#/$defs/Overall" },
                findings: { items: [{ $ref: "#/$defs/Finding" }] },
                self: { $ref: "#/properties/overall" },
                elsewhere: { $ref: "elsewhere.yaml" },
              },
            },
          },
        },
        bare: { type: "object" },
      },
      reads: [{ path: "/api/doctor" }],
      refusals: { "ASK-12": "once" },
    });
  });

  it("reads a file the directory lacks as null in its place", () => {
    const read = directory({
      "index.json": { ...INDEX, kinds: { gone: "kinds/gone.json", odd: 3 } },
      "kinds/x.json": {},
    });
    expect(assembledContract(read)).toEqual({
      api_version: 1,
      key_callable: null,
      kinds: { gone: null, odd: null },
      reads: null,
      refusals: null,
    });
  });

  it("leaves out a definition the directory lacks", () => {
    const read = directory({
      "index.json": { api_version: 1, kinds: { one: "kinds/one.json" } },
      "kinds/one.json": { properties: { a: { $ref: "../defs/Missing.json" } } },
    });
    expect(assembledContract(read)).toEqual({
      api_version: 1,
      key_callable: null,
      kinds: { one: { properties: { a: { $ref: "#/$defs/Missing" } } } },
      reads: null,
      refusals: null,
    });
  });

  it("takes an index with no kinds as a contract with none", () => {
    expect(
      assembledContract(directory({ "index.json": { api_version: 2 } })),
    ).toEqual({
      api_version: 2,
      key_callable: null,
      kinds: {},
      reads: null,
      refusals: null,
    });
  });

  it("gives nothing for a directory with no readable index", () => {
    expect(assembledContract(directory({}))).toBeNull();
    expect(assembledContract(() => "not json")).toBeNull();
    expect(assembledContract(directory({ "index.json": [1] }))).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  anchorOf,
  codesIn,
  codesWhere,
  familyAnchor,
  familyTitle,
  parseRegistry,
  runsOf,
} from "./registry.ts";
import { registry } from "./schema-source.ts";

const CODE = {
  code: "VPN-1",
  exit: 1,
  family: "VPN",
  meaning: "Traffic left outside the tunnel.",
  name: "LEAKING",
  remedy: "Stop the client.",
  severity: "critical",
  since: "0.1.0",
  status: 500,
  summary: "Raised when traffic leaves.",
};

const TEXT = JSON.stringify({
  families: [
    { covers: "traffic leaving the tunnel", prefix: "VPN" },
    { covers: "your settings", prefix: "CONFIG" },
  ],
  codes: [CODE, { ...CODE, code: "CONFIG-1", family: "CONFIG", exit: 5 }],
  retired: ["QUOTA-3"],
});

describe("parseRegistry", () => {
  it("reads every family, code and retired code", () => {
    const registry = parseRegistry(TEXT);
    expect(registry?.families).toHaveLength(2);
    expect(registry?.codes.map((one) => one.code)).toEqual([
      "VPN-1",
      "CONFIG-1",
    ]);
    expect(registry?.retired).toEqual(["QUOTA-3"]);
  });

  it("refuses a registry that is missing, not JSON, or not its shape", () => {
    const shaped = (change: object): string =>
      JSON.stringify({ ...JSON.parse(TEXT), ...change });
    expect(parseRegistry(null)).toBeNull();
    expect(parseRegistry("{")).toBeNull();
    expect(parseRegistry("[]")).toBeNull();
    expect(parseRegistry("null")).toBeNull();
    expect(parseRegistry(shaped({ families: {} }))).toBeNull();
    expect(parseRegistry(shaped({ codes: {} }))).toBeNull();
    expect(parseRegistry(shaped({ retired: {} }))).toBeNull();
    expect(parseRegistry(shaped({ families: [{ prefix: "VPN" }] }))).toBeNull();
    expect(parseRegistry(shaped({ families: ["VPN"] }))).toBeNull();
    expect(parseRegistry(shaped({ retired: [3] }))).toBeNull();
    for (const wrong of [
      { severity: "fatal" },
      { exit: 1.5 },
      { status: "500" },
      { meaning: 1 },
    ])
      expect(
        parseRegistry(shaped({ codes: [{ ...CODE, ...wrong }] })),
      ).toBeNull();
  });

  it("reads the registry the pinned core publishes", () => {
    expect(registry()?.codes.some((one) => one.code === "VPN-1")).toBe(true);
  });
});

describe("the helpers", () => {
  const registry = parseRegistry(TEXT);

  it("titles a family by its prefix and what it covers", () => {
    expect(
      familyTitle({ prefix: "VPN", covers: "traffic leaving the tunnel" }),
    ).toBe("VPN — traffic leaving the tunnel");
  });

  it("takes one family's codes, and anchors a code in lower case", () => {
    expect(
      registry && codesIn(registry, "CONFIG").map((one) => one.code),
    ).toEqual(["CONFIG-1"]);
    expect(anchorOf("PLUGIN-34")).toBe("plugin-34");
  });

  it("anchors a family the way the index always has", () => {
    expect(
      familyAnchor({
        prefix: "HANDOFF",
        covers: "pointing somebody's device at the stack",
      }),
    ).toBe("handoff--pointing-somebodys-device-at-the-stack");
    expect(
      familyAnchor({
        prefix: "SPACE",
        covers: "the disk, and letting a download go.",
      }),
    ).toBe("space--the-disk-and-letting-a-download-go");
  });

  it("picks codes by severity, by exit, or by both", () => {
    const codes = (which: Parameters<typeof codesWhere>[1]): string[] =>
      registry ? codesWhere(registry, which).map((one) => one.code) : [];
    expect(codes({ severity: "critical" })).toEqual(["VPN-1", "CONFIG-1"]);
    expect(codes({ exit: 5 })).toEqual(["CONFIG-1"]);
    expect(codes({ severity: "critical", exit: 1 })).toEqual(["VPN-1"]);
    expect(codes({})).toHaveLength(2);
  });
});

describe("runsOf", () => {
  it("reads code and links between runs of text, and makes this site's links local", () => {
    expect(
      runsOf(
        "Run `lemonfiber doctor`, then see [the bundle](http://localhost/fixing/the-support-bundle/) or [upstream](http://127.0.0.1:9/x).",
        "http://localhost",
      ),
    ).toEqual([
      { kind: "text", text: "Run " },
      { kind: "code", text: "lemonfiber doctor" },
      { kind: "text", text: ", then see " },
      { kind: "link", text: "the bundle", href: "/fixing/the-support-bundle/" },
      { kind: "text", text: " or " },
      { kind: "link", text: "upstream", href: "http://127.0.0.1:9/x" },
      { kind: "text", text: "." },
    ]);
  });

  it("reads a line with no marks, and one that is all mark", () => {
    expect(runsOf("Plain.", "http://localhost")).toEqual([
      { kind: "text", text: "Plain." },
    ]);
    expect(runsOf("`a`", "http://localhost")).toEqual([
      { kind: "code", text: "a" },
    ]);
    expect(runsOf("", "http://localhost")).toEqual([]);
  });
});

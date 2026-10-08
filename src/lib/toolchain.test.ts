import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { Page } from "./counts.ts";
import { rustVersionIn, toolchainViolations, WORKSPACE } from "./toolchain.ts";

const WORKSPACE_MANIFEST = [
  "[workspace]",
  'members = ["crates/*"]',
  "",
  "[workspace.package]",
  'version = "0.17.0"',
  'rust-version = "1.95"',
].join("\n");

const page = (
  text: string,
  path = "src/content/docs/start/install.md",
): Page => ({ path, text });

const SAYS = page("Intro.\n\nYou need a Rust toolchain, 1.95 or newer.\n");

describe("rustVersionIn", () => {
  it("reads the workspace's, and a package's where there is no workspace", () => {
    expect(rustVersionIn(WORKSPACE_MANIFEST)).toBe("1.95");
    expect(rustVersionIn('[package]\nrust-version = "1.80.1"')).toBe("1.80.1");
    expect(
      rustVersionIn(`${WORKSPACE_MANIFEST}\n[package]\nrust-version = "1.70"`),
    ).toBe("1.95");
  });

  it("reads nothing where none is named, or as a string", () => {
    expect(rustVersionIn("[workspace]\n")).toBeNull();
    expect(rustVersionIn("[workspace.package]\nrust-version = 1")).toBeNull();
    expect(rustVersionIn("= not toml")).toBeNull();
  });

  it("reads the toolchain the pinned workspace names", () => {
    expect(rustVersionIn(readFileSync(WORKSPACE, "utf8"))).toMatch(
      /^\d+\.\d+(\.\d+)?$/,
    );
  });
});

describe("toolchainViolations", () => {
  it("passes a page that names the workspace's toolchain", () => {
    expect(toolchainViolations(WORKSPACE_MANIFEST, [SAYS])).toEqual([]);
  });

  it("reads a toolchain named down to the patch", () => {
    expect(
      toolchainViolations('[package]\nrust-version = "1.80.1"', [
        page("A Rust toolchain, 1.80.1 or newer."),
      ]),
    ).toEqual([]);
  });

  it("reports a page naming another, where it says it, with the fix", () => {
    const stale = page(
      "Intro.\n\nYou need a Rust toolchain,\n1.90 or newer.\n",
    );
    const found = toolchainViolations(WORKSPACE_MANIFEST, [SAYS, stale]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      where: stale.path,
      line: 3,
      message: `says a Rust toolchain, 1.90 or newer, where ${WORKSPACE} names 1.95`,
      fix: { path: stale.path, replacement: "1.95" },
    });
    const fix = found[0]?.fix;
    expect(stale.text.slice(fix?.start, fix?.end)).toBe("1.90");
  });

  it("reports every page that disagrees", () => {
    const other = page("A Rust toolchain, 1.80 or newer.", "README.md");
    expect(
      toolchainViolations(WORKSPACE_MANIFEST, [
        page("A Rust toolchain, 1.9 or newer."),
        other,
      ]).map((one) => one.where),
    ).toEqual(["src/content/docs/start/install.md", "README.md"]);
  });

  it("refuses a workspace naming no toolchain, and pages naming none", () => {
    expect(toolchainViolations("[workspace]\n", [SAYS])).toEqual([
      expect.objectContaining({ where: WORKSPACE, line: null }),
    ]);
    const silent = toolchainViolations(WORKSPACE_MANIFEST, [page("Nothing.")]);
    expect(silent).toHaveLength(1);
    expect(silent[0]?.message).toMatch(/watching nothing/);
  });
});

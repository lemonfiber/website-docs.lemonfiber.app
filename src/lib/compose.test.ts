import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { serviceBlock } from "./compose.ts";

const FILE = [
  "# A fragment.",
  "services:",
  "  sonarr:",
  "    image: sonarr:4",
  "    # a note",
  "    profiles: [tv]",
  "",
  "  request-gate_2.x:",
  "    image: radarr:5",
  "",
  "networks:",
  "  default: {}",
].join("\n");

describe("serviceBlock", () => {
  it("takes one service, up to the next one", () => {
    expect(serviceBlock(FILE, "sonarr")).toBe(
      "services:\n  sonarr:\n    image: sonarr:4\n    # a note\n    profiles: [tv]",
    );
  });

  it("stops at a top-level key, and leaves trailing blank lines out", () => {
    expect(serviceBlock(FILE, "request-gate_2.x")).toBe(
      "services:\n  request-gate_2.x:\n    image: radarr:5",
    );
  });

  it("takes a last service to the end of the file", () => {
    expect(serviceBlock("services:\n  one:\n    image: x\n", "one")).toBe(
      "services:\n  one:\n    image: x",
    );
  });

  it("reads nothing for a service the file does not hold", () => {
    expect(serviceBlock(FILE, "lidarr")).toBeNull();
  });

  it("reads the Sonarr entry the pinned stack runs", () => {
    const block = serviceBlock(
      readFileSync("vendor/lemonfiber-media-stack/compose/tv.yml", "utf8"),
      "sonarr",
    );
    expect(block).toContain("image: lscr.io/linuxserver/sonarr");
  });
});

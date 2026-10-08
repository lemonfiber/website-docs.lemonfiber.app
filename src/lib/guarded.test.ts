import { HEALTH } from "@lemonfiber/website-kit/health";
import { watched } from "@lemonfiber/website-kit/pins";
import { TOKENS } from "@lemonfiber/website-kit/tokens";
import { describe, expect, it } from "vitest";

import { ARTEFACT } from "./codes.ts";
import { FORMULAE } from "./formula.ts";
import { GUARDED } from "./guarded.ts";
import { INVENTORIES } from "./inventories.ts";

describe("what a guard reads", () => {
  it("takes every inventory's source and the error-code artefact", () => {
    expect(GUARDED).toContain(ARTEFACT);
    for (const inventory of INVENTORIES)
      expect(GUARDED).toContain(inventory.source);
  });

  it("names each source once, however many inventories declare it", () => {
    expect(new Set(GUARDED).size).toBe(GUARDED.length);
  });

  it("holds what the guards that are not inventories read", () => {
    const sources = INVENTORIES.map((one) => one.source);
    for (const artefact of [ARTEFACT, FORMULAE, TOKENS, HEALTH]) {
      expect(sources).not.toContain(artefact);
      expect(GUARDED).toContain(artefact);
    }
  });

  it("reaches into the tap, which held no guarded path before", () => {
    expect(watched(GUARDED, ["vendor/homebrew-tap"])).toEqual([
      { module: "vendor/homebrew-tap", path: "Formula" },
    ]);
  });

  it("reaches into brand, which held no guarded path before", () => {
    expect(watched(GUARDED, ["vendor/brand"])).toEqual([
      { module: "vendor/brand", path: "tokens/tokens.css" },
    ]);
  });

  it("reaches into the org, which held no guarded path before", () => {
    expect(watched(GUARDED, ["vendor/org"])).toEqual([
      { module: "vendor/org", path: "" },
    ]);
  });

  it("reaches into the web surface, which held no guarded path before", () => {
    expect(watched(GUARDED, ["vendor/lemonfiber-web"])).toEqual([
      { module: "vendor/lemonfiber-web", path: "package.json" },
      { module: "vendor/lemonfiber-web", path: "src/lib/route.ts" },
    ]);
  });

  it("watches the artefact that made a page wrong while its guard stayed green", () => {
    expect(watched(GUARDED, ["vendor/lemonfiber"])).toContainEqual({
      module: "vendor/lemonfiber",
      path: "reference/error-codes.md",
    });
  });
});

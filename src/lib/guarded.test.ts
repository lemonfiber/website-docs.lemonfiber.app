import { watched } from "@lemonfiber/website-kit/pins";
import { TOKENS } from "@lemonfiber/website-kit/tokens";
import { describe, expect, it } from "vitest";

import { FORMULAE } from "./formula.ts";
import { GUARDED } from "./guarded.ts";
import { INVENTORIES } from "./inventories.ts";
import { REGISTRY } from "./registry.ts";

describe("what a guard reads", () => {
  it("takes every inventory's source and the registry of codes", () => {
    expect(GUARDED).toContain(REGISTRY);
    for (const inventory of INVENTORIES)
      expect(GUARDED).toContain(inventory.source);
  });

  it("names each source once, however many inventories declare it", () => {
    expect(new Set(GUARDED).size).toBe(GUARDED.length);
  });

  it("holds what the guards that are not inventories read", () => {
    const sources = INVENTORIES.map((one) => one.source);
    for (const artefact of [FORMULAE, TOKENS]) {
      expect(sources).not.toContain(artefact);
      expect(GUARDED).toContain(artefact);
    }
  });

  it.each([
    ["the tap", "vendor/homebrew-tap", ["Formula"]],
    ["brand", "vendor/brand", ["tokens/tokens.css"]],
    ["the web surface", "vendor/lemonfiber-web", ["src/lib/route.ts"]],
  ])(
    "reaches into %s, which held no guarded path before",
    (_, module, paths) => {
      expect(watched(GUARDED, [module])).toEqual(
        paths.map((path) => ({ module, path })),
      );
    },
  );

  it("watches the registry the error-code pages are rendered from", () => {
    expect(watched(GUARDED, ["vendor/lemonfiber"])).toContainEqual({
      module: "vendor/lemonfiber",
      path: "contract/codes.json",
    });
  });
});

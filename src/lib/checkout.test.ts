import { describe, expect, it } from "vitest";

import { readText, revisionAt } from "./checkout.ts";

describe("readText", () => {
  it("reads a file the checkout holds, and nothing for one it does not", () => {
    expect(readText("package.json")).toContain('"name"');
    expect(readText("no/such/file")).toBeNull();
  });
});

describe("revisionAt", () => {
  it("names the commit a pinned repository sits on", () => {
    expect(revisionAt("vendor/lemonfiber")?.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it("gives nothing for a directory git cannot read", () => {
    expect(revisionAt("no/such/directory")).toBeNull();
  });
});

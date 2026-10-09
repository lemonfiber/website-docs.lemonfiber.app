import { describe, expect, it } from "vitest";

import { fromRelease, onNext, present } from "./release.ts";

describe("which pins a build renders", () => {
  it("is a release's where DOCS_PINS names them, and next's otherwise", () => {
    expect(fromRelease({ DOCS_PINS: "pins/stable.toml" })).toBe(true);
    expect(fromRelease({})).toBe(false);
  });
});

describe("present", () => {
  it("passes a value through in any build", () => {
    expect(present(1, "never", {})).toBe(1);
    expect(present(1, "never", { DOCS_PINS: "p" })).toBe(1);
  });

  it("gives a release's build nothing for a missing value, and fails next's", () => {
    expect(present(null, "missing", { DOCS_PINS: "p" })).toBeNull();
    expect(() => present(null, "missing", {})).toThrow("missing");
  });
});

describe("onNext", () => {
  it("finds the same page on next, whatever base the build is at", () => {
    expect(onNext("/fixing/codes/plugin/", "/")).toBe(
      "/next/fixing/codes/plugin/",
    );
    expect(onNext("/v0.16/fixing/", "/v0.16/")).toBe("/next/fixing/");
  });
});

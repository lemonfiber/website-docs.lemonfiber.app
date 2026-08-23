import { describe, expect, it } from "vitest";

import { plain } from "./markdown.ts";

describe("plain", () => {
  it("takes the marks off code, links and emphasis", () => {
    expect(plain("a `code` span")).toBe("a code span");
    expect(plain("see [the page](./other.md) for more")).toBe(
      "see the page for more",
    );
    expect(plain("**loud** and quiet")).toBe("loud and quiet");
  });

  it("resolves an escape to the character it protected", () => {
    expect(plain("\\*arr")).toBe("*arr");
    expect(plain("a \\| b")).toBe("a | b");
  });

  it("joins a run of whitespace into one space", () => {
    expect(plain("one\n  two\tthree ")).toBe("one two three");
  });

  it("leaves text that carries no marks alone", () => {
    expect(plain("plain words")).toBe("plain words");
    expect(plain("")).toBe("");
  });
});

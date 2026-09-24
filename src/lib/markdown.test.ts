import { describe, expect, it } from "vitest";

import { paragraphs, plain } from "./markdown.ts";

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

describe("paragraphs", () => {
  it("splits on a blank line and marks the code in each", () => {
    expect(
      paragraphs("Named `held`, and *only* that.\n\nSecond\none."),
    ).toEqual([
      [
        { code: false, text: "Named " },
        { code: true, text: "held" },
        { code: false, text: ", and only that." },
      ],
      [{ code: false, text: "Second one." }],
    ]);
  });

  it("keeps nothing of a paragraph that is only whitespace", () => {
    expect(paragraphs("")).toEqual([]);
    expect(paragraphs("a\n\n  \n\nb")).toEqual([
      [{ code: false, text: "a" }],
      [{ code: false, text: "b" }],
    ]);
  });

  it("keeps the space either side of a code span", () => {
    expect(paragraphs("`a` b")).toEqual([
      [
        { code: true, text: "a" },
        { code: false, text: " b" },
      ],
    ]);
  });

  it("reads a lone mark as a word rather than as code", () => {
    expect(paragraphs("a ` b")).toEqual([[{ code: false, text: "a ` b" }]]);
  });
});

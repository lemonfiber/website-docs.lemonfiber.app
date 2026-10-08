import { describe, expect, it } from "vitest";

import { sectionsOf, topicOf, wholeOf, type Page } from "./published.ts";

const PAGES: Page[] = [
  {
    id: "start/install",
    filePath: "src/content/docs/start/install.md",
    body: "Install it.",
    data: { title: "Install", description: "Get the binary.", topic: "use" },
  },
  {
    id: "api/typescript-sdk",
    filePath: "src/content/docs/api/typescript-sdk.md",
    body: "The client.",
    data: { title: "The TypeScript SDK" },
  },
  { id: "index", data: { title: "Home", topic: "use" } },
  {
    id: "fixing/doctor",
    filePath: "src/content/docs/fixing/doctor.md",
    data: { title: "The doctor", topic: "use" },
  },
  { id: "elsewhere", data: { title: "Nowhere" } },
  { id: "start/after", data: { title: "After", topic: "use" } },
];

describe("topicOf", () => {
  it("takes a page's own topic, else its section's, else none", () => {
    expect(PAGES.map(topicOf)).toEqual([
      "use",
      "build",
      "use",
      "use",
      null,
      "use",
    ]);
  });
});

describe("sectionsOf", () => {
  it("lists each topic's pages section by section, under the label given", () => {
    expect(sectionsOf(PAGES, (topic) => topic.toUpperCase())).toEqual([
      {
        label: "USE",
        pages: [
          { route: "/", title: "Home", description: undefined },
          { route: "/start/after/", title: "After", description: undefined },
          {
            route: "/start/install/",
            title: "Install",
            description: "Get the binary.",
          },
          {
            route: "/fixing/doctor/",
            title: "The doctor",
            description: undefined,
          },
        ],
      },
      {
        label: "BUILD",
        pages: [
          {
            route: "/api/typescript-sdk/",
            title: "The TypeScript SDK",
            description: undefined,
          },
        ],
      },
    ]);
  });
});

describe("wholeOf", () => {
  it("gives every page in full, in route order", () => {
    expect(wholeOf(PAGES).map((one) => [one.route, one.body])).toEqual([
      ["/", ""],
      ["/api/typescript-sdk/", "The client."],
      ["/elsewhere/", ""],
      ["/fixing/doctor/", ""],
      ["/start/after/", ""],
      ["/start/install/", "Install it."],
    ]);
  });
});

import { describe, expect, it } from "vitest";

import {
  declaredTopic,
  TOPICS,
  topicOfTree,
  topicViolations,
} from "./topics.ts";

const page = (
  path: string,
  topic: string | null,
): { path: string; text: string } => ({
  path: `src/content/docs/${path}`,
  text: [
    "---",
    "title: A page",
    ...(topic === null ? [] : [`topic: ${topic}`]),
    "---",
    "",
    "topic: in the body, which is not frontmatter",
  ].join("\n"),
});

describe("declaredTopic", () => {
  it("reads the topic from the frontmatter, quoted or not", () => {
    expect(declaredTopic("---\ntitle: x\ntopic: use\n---\n")).toBe("use");
    expect(declaredTopic('---\ntopic: "build"\n---\n')).toBe("build");
  });

  it("finds none in a page without frontmatter, or past its end", () => {
    expect(declaredTopic("topic: use\n")).toBeNull();
    expect(declaredTopic("---\ntitle: x\n---\ntopic: use\n")).toBeNull();
    expect(declaredTopic("---\ntitle: x\ntopic\n")).toBeNull();
  });
});

describe("topicOfTree", () => {
  it("places each section under its topic", () => {
    for (const [topic, sections] of Object.entries(TOPICS))
      for (const section of sections)
        expect(topicOfTree(`src/content/docs/${section}/a.md`)).toBe(topic);
  });

  it("places a root page, and a section no topic lists, under none", () => {
    expect(topicOfTree("src/content/docs/index.mdx")).toBeNull();
    expect(topicOfTree("src/content/docs/elsewhere/a.md")).toBeNull();
    expect(topicOfTree("start/a.md")).toBe("use");
  });
});

describe("topicViolations", () => {
  it("passes every page that declares the topic of its tree", () => {
    expect(
      topicViolations([
        page("start/install.md", "use"),
        page("api/kinds.md", "build"),
        page("index.mdx", "use"),
        page("spec.mdx", "build"),
      ]),
    ).toEqual([]);
  });

  it("names a page that declares no topic, or one that is not a topic", () => {
    expect(
      topicViolations([
        page("start/a.md", null),
        page("start/b.md", "run"),
      ]).map((one) => one.message),
    ).toEqual([
      "declares no topic — name use or build",
      'declares the topic "run" — name use or build',
    ]);
  });

  it("names a page under the other topic's tree, or under no topic's", () => {
    expect(
      topicViolations([page("api/a.md", "use"), page("elsewhere/a.md", "use")]),
    ).toEqual([
      {
        where: "src/content/docs/api/a.md",
        line: null,
        message: "declares use and sits in a section under build",
      },
      {
        where: "src/content/docs/elsewhere/a.md",
        line: null,
        message: "sits in a section no topic lists",
      },
    ]);
  });
});

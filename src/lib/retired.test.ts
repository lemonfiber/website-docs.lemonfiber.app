import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import retired from "../../retired.json";

const RETIRED: Record<string, string> = retired.redirects;

const CONTENT = new URL("../content/docs/", import.meta.url);

describe("the retired routes in retired.json", () => {
  it("sends every one to a page off this site", () => {
    for (const target of Object.values(RETIRED))
      expect(target).toMatch(
        /^https:\/\/(contribute\.lemonfiber\.app|github\.com\/lemonfiber\/spec\/blob\/main)\//,
      );
  });

  it("covers both sections it retired, and every page under them", () => {
    const routes = Object.keys(RETIRED);
    expect(
      routes.filter((one) => one.startsWith("/contributing/")),
    ).toHaveLength(10);
    expect(routes.filter((one) => one.startsWith("/develop/"))).toHaveLength(
      26,
    );
  });

  it("leaves no page of this site's own at a retired route", () => {
    for (const route of Object.keys(RETIRED)) {
      const at = route.slice(1, -1);
      for (const file of [`${at}.md`, `${at}.mdx`, `${at}/index.mdx`])
        expect(existsSync(new URL(file, CONTENT))).toBe(false);
    }
  });
});

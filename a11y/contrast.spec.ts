import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * One route of every kind the site serves, in both themes: the landing page,
 * an authored page, a section landing page, mirrored pages from two different
 * repositories, the error-code index and the longest of the tables it leads to,
 * and the two reference pages rendered from a contract artefact.
 */
const routes = [
  "/",
  "/start/",
  "/start/what-lemonfiber-is/",
  "/fixing/",
  "/fixing/every-error-by-code/",
  "/fixing/codes/plugin/",
  "/commands/",
  "/api/reference/",
  "/plugins/the-manifest/",
  "/api/typescript-sdk/",
  "/plugins/the-template/",
];
const themes = ["light", "dark"] as const;

/**
 * The route that renders the web API's whole contract artefact on one page. Axe
 * reads every node, and there that takes longer than one test's default budget.
 */
const long = new Set(["/api/reference/"]);

for (const route of routes)
  for (const theme of themes)
    test(`${route} has no contrast or a11y violations in ${theme}`, async ({
      page,
    }) => {
      if (long.has(route)) test.slow();
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(route);
      await page.evaluate((t) => {
        document.documentElement.dataset["theme"] = t;
      }, theme);
      await page.waitForFunction(
        (t) =>
          document.documentElement.dataset["lfTheme"] ===
          (t === "dark" ? "ink" : "paper"),
        theme,
      );

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(results.violations).toEqual([]);
    });

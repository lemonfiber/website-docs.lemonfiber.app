import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * One route of every kind the site serves, in both themes: the landing page,
 * an authored page, a section landing page, a mirrored page, a mirrored page
 * from a repository other than the specification, a long reference table, and
 * the two pages built from the pinned checkout rather than from prose.
 */
const routes = [
  "/",
  "/start/",
  "/start/what-lemonfiber-is/",
  "/project/roadmap/",
  "/project/changelog/",
  "/fixing/",
  "/fixing/every-error-by-code/",
  "/commands/",
  "/spec/",
  "/spec/00-overview/vision/",
  "/spec/10-functional/features/b-running/b1-forms/",
  "/develop/architecture/error-model/",
  "/develop/repos/sdk-ts/",
  "/contributing/conduct/",
];
const themes = ["light", "dark"] as const;

for (const route of routes)
  for (const theme of themes)
    test(`${route} has no contrast or a11y violations in ${theme}`, async ({
      page,
    }) => {
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

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Every route the site serves today, in both themes. */
const routes = ["/", "/start/what-lemonfiber-is/"];
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

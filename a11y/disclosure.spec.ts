import { expect, test } from "@playwright/test";

/** One entry of the version train, as the rendered page holds it. */
interface Entry {
  readonly version: string;
  readonly shipped: boolean;
  readonly open: boolean;
}

const ENTRIES = ".vlist > li > details";

/**
 * The version train's disclosure, read off the page that renders it.
 *
 * A released version renders collapsed and every other status renders open.
 * The pill inside the summary is what marks a released one, so each entry is
 * held to its own marking rather than to a list of versions kept here, which
 * a pin moving would leave stale.
 */
test.describe("the roadmap's version train", () => {
  test("collapses what has shipped and opens what has not", async ({
    page,
  }) => {
    await page.goto("/project/roadmap/");

    const entries: Entry[] = await page.locator(ENTRIES).evaluateAll((nodes) =>
      nodes.map((node) => ({
        version: node.querySelector(".ver__id")?.textContent.trim() ?? "",
        shipped: node.querySelector(".vpill--shipped") !== null,
        open: node instanceof HTMLDetailsElement && node.open,
      })),
    );

    const shipped = entries.filter((entry) => entry.shipped);
    const ahead = entries.filter((entry) => !entry.shipped);
    expect(shipped.length).toBeGreaterThan(0);
    expect(ahead.length).toBeGreaterThan(0);

    for (const entry of shipped) {
      expect(entry.version).not.toBe("");
      expect(entry.open, `${entry.version} has shipped`).toBe(false);
    }
    for (const entry of ahead)
      expect(entry.open, `${entry.version} has not shipped`).toBe(true);
  });

  test("opens a collapsed entry from the keyboard", async ({ page }) => {
    await page.goto("/project/roadmap/");

    const all = page.locator(ENTRIES);
    const open = await all.evaluateAll((nodes) =>
      nodes.map((node) => node instanceof HTMLDetailsElement && node.open),
    );
    const first = open.indexOf(false);
    expect(first).toBeGreaterThanOrEqual(0);

    const entry = all.nth(first);
    const summary = entry.locator("summary");
    await summary.press("Enter");

    await expect(summary).toBeFocused();
    await expect(entry).toHaveJSProperty("open", true);
  });
});

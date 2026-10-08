import { ORIGIN_VARIABLE } from "@lemonfiber/website-kit/run/a11y";
import { defineConfig, devices } from "@playwright/test";

/** The preview `npm run a11y` serves, on the port it chose. */
const origin = process.env[ORIGIN_VARIABLE];
if (!origin)
  throw new Error(
    `${ORIGIN_VARIABLE} is unset: run the sweep as \`npm run a11y\`, which serves the built site and names where`,
  );

export default defineConfig({
  testDir: "./a11y",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: origin },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

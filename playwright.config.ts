import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./a11y",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4321" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

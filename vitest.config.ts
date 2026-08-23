import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // The authored TypeScript: the guard rules, the loaders and the
      // components. Prose in src/content and generated output are not code.
      include: ["src/lib/**/*.ts", "src/components/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/paraglide/**", "src/lib/sections.ts"],
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 100,
        statements: 100,
        branches: 100,
        functions: 100,
      },
    },
  },
});

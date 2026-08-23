import js from "@eslint/js";
import globals from "globals";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/",
      "coverage/",
      ".astro/",
      "vendor/",
      "src/paraglide/**",
      "eslint.config.js",
      ".dependency-cruiser.cjs",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...astro.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
    },
  },

  {
    files: ["**/*.test.ts"],
    rules: { "@typescript-eslint/no-unsafe-assignment": "off" },
  },

  // The Astro parser reports the type of every expression in a template as an
  // error type, so a list rendered from a `.map` is an unsafe return to this
  // rule and to nothing else. `astro check` type-checks these files, at zero
  // hints, and it reads the templates with the compiler that renders them.
  {
    files: ["**/*.astro"],
    rules: { "@typescript-eslint/no-unsafe-return": "off" },
  },

  // The guards and sync scripts are the files the whole quality story rests on.
  // They are linted, with Node globals and a console they are allowed to use.
  {
    files: ["scripts/**/*.ts", "*.config.ts"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  },
);

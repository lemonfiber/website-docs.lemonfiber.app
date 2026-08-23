import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import starlightLinksValidator from "starlight-links-validator";

import { sections } from "./src/lib/sections";

export default defineConfig({
  site: "https://docs.lemonfiber.app",
  trailingSlash: "always",
  vite: {
    plugins: [
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
      }),
    ],
  },
  integrations: [
    starlight({
      title: "lemonfiber",
      description:
        "Documentation for lemonfiber: install it, run it, fix it, and build on it.",
      defaultLocale: "en",
      locales: { root: { label: "English", lang: "en" } },
      lastUpdated: true,
      pagination: true,
      customCss: ["./src/app.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/lemonfiber/lemonfiber",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/lemonfiber/website-docs.lemonfiber.app/edit/main/",
      },
      sidebar: sections,
      plugins: [starlightLinksValidator({ errorOnRelativeLinks: false })],
    }),
  ],
});

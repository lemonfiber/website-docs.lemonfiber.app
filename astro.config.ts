import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import starlightLinksValidator from "starlight-links-validator";
import starlightSidebarTopics from "starlight-sidebar-topics";

import retired from "./retired.json";
import { baseIntegration } from "./src/lib/base";
import { topics } from "./src/lib/sections";

const base = process.env["DOCS_BASE"] ?? "/";
// A versioned build renders the pins a release recorded (REPO-R88) and sends a
// reader on to `next` for a page that release does not have.
const versioned = process.env["DOCS_PINS"] !== undefined;

export default defineConfig({
  site: "https://docs.lemonfiber.app",
  // The path this build is published at (REPO-R89): `/` for the newest stable,
  // `/next/` for the submodule pins, `/v<major>.<minor>/` for a kept version.
  base,
  trailingSlash: "always",
  // A page that moved keeps its address: the build writes a page at the old
  // one that sends a reader on.
  redirects: retired.redirects,
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
      head: [
        {
          tag: "script",
          content:
            "(function(){var d=document.documentElement;" +
            "var sync=function(){d.dataset.lfTheme=d.dataset.theme==='dark'?'ink':'paper';};" +
            "sync();new MutationObserver(sync).observe(d,{attributes:true,attributeFilter:['data-theme']});})();",
        },
      ],
      // A code block that scrolls sideways has to be reachable from a
      // keyboard, and Expressive Code does not make one focusable. Wrapping
      // removes the scroll region instead of adding a tab stop to every
      // sample, and keeps long terminal output readable on a narrow screen.
      expressiveCode: { defaultProps: { wrap: true, preserveIndent: true } },
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
      components: {
        Footer: "./src/components/Footer.astro",
        LanguageSelect: "./src/components/VersionSelect.astro",
      },
      plugins: [
        starlightSidebarTopics(topics),
        // The validator reads each page as written, against the root, and
        // holds every page to the pages beside it. A versioned build places its
        // addresses after the build, where it cannot see them, and lacks pages
        // added since its release; the same pages are validated by the build
        // from the submodule pins.
        ...(base === "/" && !versioned
          ? [
              starlightLinksValidator({
                errorOnRelativeLinks: false,
                errorOnInvalidHashes: false,
              }),
            ]
          : []),
      ],
    }),
    baseIntegration({ base, fallback: versioned ? "/next/" : null }),
  ],
});

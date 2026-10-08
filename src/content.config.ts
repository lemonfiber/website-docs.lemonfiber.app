import { docsSchema } from "@astrojs/starlight/schema";
import { glob, type Loader, type LoaderContext } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import manifest from "../mirrors.json";
import type { Mirror } from "@lemonfiber/website-kit/mirror";
import {
  mirrorLoader,
  provenanceSchema,
} from "@lemonfiber/website-kit/mirror-loader";

import { parseStable, renderedIn } from "./lib/stable.ts";
import { TOPIC_NAMES } from "./lib/topics.ts";

/** The pin set a versioned build renders, where it renders one (REPO-R88). */
const pinned = process.env["DOCS_PINS"];
const stable =
  pinned === undefined ? null : parseStable(readFileSync(pinned, "utf8"));

const declared = manifest.mirrors as readonly Mirror[];
const mirrors = renderedIn(declared, stable, existsSync);
const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

// Every declared route, rendered in this build or not, is a mirror's and never
// an owned page.
const ignore = declared.map((mirror) =>
  mirror.route.endsWith(".md") ? `!${mirror.route}` : `!${mirror.route}/**`,
);

const owned = glob({
  base: "src/content/docs",
  pattern: ["**/[^_]*.{md,mdx}", ...ignore],
});
const mirrored = mirrorLoader(mirrors, root);

/**
 * One collection, two sources. `owned` is what this repository wrote; `mirrored`
 * is what it renders through the symlinks its submodules stand behind. The glob
 * runs first: it removes any entry it no longer finds, and the mirrors are added
 * after so that pass cannot take them with it.
 */
const loader: Loader = {
  name: "lemonfiber-docs-loader",
  load: async (context: LoaderContext): Promise<void> => {
    await owned.load(context);
    await mirrored.load(context);
  },
};

export const collections = {
  docs: defineCollection({
    loader,
    // `topic` is what the sidebar plugin reads to place a page. A mirrored page
    // carries none and takes the topic of the section its route sits in.
    schema: docsSchema({
      extend: z.object({
        mirror: provenanceSchema,
        topic: z.enum(TOPIC_NAMES).optional(),
      }),
    }),
  }),
};

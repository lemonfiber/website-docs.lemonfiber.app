import { docsSchema } from "@astrojs/starlight/schema";
import { glob, type Loader, type LoaderContext } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { fileURLToPath } from "node:url";

import manifest from "../mirrors.json";
import type { Mirror } from "./lib/mirror";
import { mirrorLoader } from "./lib/mirror-loader";

const mirrors = manifest.mirrors as readonly Mirror[];
const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

const ignore = mirrors.map((mirror) =>
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

const provenance = z
  .object({
    repo: z.string(),
    label: z.string(),
    revision: z.string(),
    date: z.string(),
    source: z.string(),
  })
  .optional();

export const collections = {
  docs: defineCollection({
    loader,
    schema: docsSchema({ extend: z.object({ mirror: provenance }) }),
  }),
};

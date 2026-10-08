/** The index of this site's pages a machine reads on somebody's behalf. */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { llmsIndex } from "@lemonfiber/website-kit/llms";

import { sectionsOf } from "../lib/published";
import * as m from "../paraglide/messages.js";

const labels = { use: m.topic_use, build: m.topic_build };

export const GET: APIRoute = async ({ site }) => {
  if (site === undefined) throw new Error("llms.txt: no site is configured");
  const text = llmsIndex(
    {
      name: m.site_title(),
      summary: m.site_tagline(),
      origin: site.origin,
    },
    sectionsOf(await getCollection("docs"), (topic) => labels[topic]()),
  );
  return new Response(text, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};

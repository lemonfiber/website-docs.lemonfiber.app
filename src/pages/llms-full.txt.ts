/** Every page of this site in full, for a machine reading on somebody's behalf. */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import { llmsFull } from "@lemonfiber/website-kit/llms";

import { wholeOf } from "../lib/published";
import * as m from "../paraglide/messages.js";

export const GET: APIRoute = async ({ site }) => {
  if (site === undefined)
    throw new Error("llms-full.txt: no site is configured");
  const text = llmsFull(
    {
      name: m.site_title(),
      summary: m.site_tagline(),
      origin: site.origin,
    },
    wholeOf(await getCollection("docs")),
  );
  return new Response(text, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};

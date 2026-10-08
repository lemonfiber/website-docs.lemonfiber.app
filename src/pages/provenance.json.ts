/** Where every route this site renders came from (REPO-R83). */
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

import {
  provenanceIndex,
  repositoryOf,
} from "@lemonfiber/website-kit/provenance";

import { readText, revisionAt } from "../lib/checkout";

export const GET: APIRoute = async () => {
  const repository = repositoryOf(readText("package.json") ?? "");
  const revision = revisionAt(".");
  if (repository === null || revision === null)
    throw new Error(
      "provenance.json: the site's own repository or revision could not be read",
    );
  const index = provenanceIndex(await getCollection("docs"), {
    repository,
    revision: revision.sha,
  });
  return new Response(`${JSON.stringify(index, null, 2)}\n`, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};

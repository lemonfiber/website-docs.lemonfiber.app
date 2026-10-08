/**
 * What the site publishes about itself for a machine: where every route came
 * from, and the index of its pages by topic.
 *
 * Pure: the endpoints under `src/pages/` read the collection and hand it here.
 */
import type { Listed, Section, Whole } from "@lemonfiber/website-kit/llms";
import type { Provenance } from "@lemonfiber/website-kit/mirror-loader";
import { routeOfEntry } from "@lemonfiber/website-kit/provenance";

import { TOPIC_NAMES, TOPICS, topicOfTree, type Topic } from "./topics.ts";

/** One page of the collection, as much of it as the index reads. */
export interface Page {
  readonly id: string;
  readonly filePath?: string;
  readonly body?: string;
  readonly data: {
    readonly title: string;
    readonly description?: string | undefined;
    readonly topic?: Topic | undefined;
    readonly mirror?: Provenance | undefined;
  };
}

/** The topic a page is listed under: its own, or that of the section it sits in. */
export const topicOf = (page: Page): Topic | null =>
  page.data.topic ?? topicOfTree(page.filePath ?? "");

const byRoute = (a: Listed, b: Listed): number => (a.route < b.route ? -1 : 1);

const listed = (page: Page): Listed => ({
  route: routeOfEntry(page.id),
  title: page.data.title,
  description: page.data.description,
});

/**
 * Where a route stands in its topic's reading order: the root first, then each
 * section in the order the topic lists it.
 */
const placeIn = (topic: Topic, route: string): number =>
  (TOPICS[topic] as readonly string[]).indexOf(
    route.slice(1, route.indexOf("/", 1)),
  );

/**
 * The pages under each topic, each labelled by `label`: section by section in
 * the topic's order, and in route order within a section.
 */
export function sectionsOf(
  pages: readonly Page[],
  label: (topic: Topic) => string,
): Section[] {
  return TOPIC_NAMES.map((topic) => ({
    label: label(topic),
    pages: pages
      .filter((page) => topicOf(page) === topic)
      .map(listed)
      .toSorted(
        (a, b) =>
          placeIn(topic, a.route) - placeIn(topic, b.route) || byRoute(a, b),
      ),
  }));
}

/** Every page in full, in route order. */
export const wholeOf = (pages: readonly Page[]): Whole[] =>
  pages
    .map((page) => ({ ...listed(page), body: page.body ?? "" }))
    .toSorted(byRoute);

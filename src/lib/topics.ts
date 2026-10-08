/**
 * The two topics this site is read in, and which tree each section sits under.
 *
 * *Use* is for an operator running lemonfiber; *Build on* is for an integrator
 * writing against it (REPO-R81). Every authored page names its topic in its
 * frontmatter, the sidebar shows one topic at a time from that declaration, and
 * the check here refuses a page that names none, or names the topic whose trees
 * it does not sit in.
 *
 * Pure functions over text. The sidebar is `sections.ts`; reading the tree is
 * the kit's.
 */

import type { Violation } from "@lemonfiber/website-kit/guards";

/** The topics, each with the section directories under it, in reading order. */
export const TOPICS = {
  use: ["start", "running", "fixing", "commands", "advanced"],
  build: ["api", "plugins"],
} as const;

export type Topic = keyof typeof TOPICS;

/** Every topic a page may declare. */
export const TOPIC_NAMES = Object.keys(TOPICS) as Topic[];

const CONTENT = "src/content/docs/";

/** A page of this site's own, as the guards read it. */
export interface Authored {
  readonly path: string;
  readonly text: string;
}

const isTopic = (value: string): value is Topic =>
  (TOPIC_NAMES as readonly string[]).includes(value);

/** The topic a page's frontmatter declares, or null where it declares none. */
export function declaredTopic(text: string): string | null {
  const lines = text.split("\n");
  if (lines[0]?.trim() !== "---") return null;
  for (const line of lines.slice(1)) {
    if (line.trim() === "---") return null;
    const [key = "", value] = line.split(":", 2);
    if (key === "topic" && value !== undefined)
      return value.trim().replaceAll(/^["']|["']$/g, "");
  }
  return null;
}

/** The topic whose trees hold a page, or null for a page at the root. */
export function topicOfTree(path: string): Topic | null {
  const inside = path.startsWith(CONTENT) ? path.slice(CONTENT.length) : path;
  const slash = inside.indexOf("/");
  if (slash === -1) return null;
  const section = inside.slice(0, slash);
  return (
    TOPIC_NAMES.find((topic) =>
      (TOPICS[topic] as readonly string[]).includes(section),
    ) ?? null
  );
}

const at = (where: string, message: string): Violation => ({
  where,
  line: null,
  message,
});

/**
 * Every authored page whose topic is missing, unknown, or the other topic's.
 *
 * A page under a section no topic lists is named too: the sidebar would show
 * it under neither, and nothing else would notice.
 */
export function topicViolations(pages: readonly Authored[]): Violation[] {
  const found: Violation[] = [];
  const listed = TOPIC_NAMES.join(" or ");

  for (const page of pages) {
    const declared = declaredTopic(page.text);
    const tree = topicOfTree(page.path);
    const nested = page.path.slice(CONTENT.length).includes("/");

    if (declared === null)
      found.push(at(page.path, `declares no topic — name ${listed}`));
    else if (!isTopic(declared))
      found.push(
        at(page.path, `declares the topic "${declared}" — name ${listed}`),
      );
    else if (nested && tree === null)
      found.push(at(page.path, "sits in a section no topic lists"));
    else if (tree !== null && tree !== declared)
      found.push(
        at(
          page.path,
          `declares ${declared} and sits in a section under ${tree}`,
        ),
      );
  }
  return found;
}

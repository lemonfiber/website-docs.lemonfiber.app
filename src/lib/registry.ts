/**
 * lemonfiber's registry of problem codes, as the core publishes it in
 * `contract/codes.json`: every family with what it covers, every code with its
 * severity, its exit, what it means and what to do, and the codes retired.
 *
 * The error-code pages are rendered from it and the guards read it, so a code
 * the core adds, renumbers or retires reaches the site with the pin and is
 * written down nowhere else.
 *
 * Pure functions over the artefact's text. Reading the file is `schema-source.ts`
 * and `scripts/guards.ts`.
 */

import { captured } from "@lemonfiber/website-kit/mirror";

/** Where the registry is, in the pinned core. */
export const REGISTRY = "vendor/lemonfiber/contract/codes.json";

/** A family of codes: its prefix, and what it covers. */
export interface Family {
  readonly prefix: string;
  readonly covers: string;
}

/** How bad a problem is, worst last. */
export const SEVERITIES = ["advisory", "warning", "error", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

/** One code, as the registry declares it. */
export interface Code {
  readonly code: string;
  readonly family: string;
  readonly name: string;
  readonly severity: Severity;
  /** The exit status a run raising it leaves with. */
  readonly exit: number;
  /** The HTTP status the web surface answers it with. */
  readonly status: number;
  readonly summary: string;
  /** What it means for the operator, in Markdown. */
  readonly meaning: string;
  /** What to do, in Markdown. */
  readonly remedy: string;
  /** The release that first raised it. */
  readonly since: string;
}

export interface Registry {
  readonly families: readonly Family[];
  readonly codes: readonly Code[];
  readonly retired: readonly string[];
}

type Node = Readonly<Record<string, unknown>>;

const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const strings = (node: Node, keys: readonly string[]): boolean =>
  keys.every((key) => typeof node[key] === "string");

const isFamily = (value: unknown): value is Family =>
  isNode(value) && strings(value, ["prefix", "covers"]);

const isCode = (value: unknown): value is Code =>
  isNode(value) &&
  strings(value, [
    "code",
    "family",
    "name",
    "summary",
    "meaning",
    "remedy",
    "since",
  ]) &&
  (SEVERITIES as readonly unknown[]).includes(value["severity"]) &&
  Number.isInteger(value["exit"]) &&
  Number.isInteger(value["status"]);

/**
 * The registry, or null where the text is missing, is not JSON, or is not
 * shaped as the registry is. A registry with an entry of the wrong shape is
 * refused whole rather than read in part, because a page rendered from part
 * of it would say a code does not exist.
 */
export function parseRegistry(text: string | null): Registry | null {
  if (text === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isNode(parsed)) return null;
  const { families, codes, retired } = parsed;
  if (
    !Array.isArray(families) ||
    !Array.isArray(codes) ||
    !Array.isArray(retired) ||
    !families.every(isFamily) ||
    !codes.every(isCode) ||
    !retired.every((one) => typeof one === "string")
  )
    return null;
  return { families, codes, retired };
}

/** A family's page title: its prefix, then what it covers. */
export const familyTitle = (family: Family): string =>
  `${family.prefix} — ${family.covers}`;

/** The codes in one family, in the order the registry lists them. */
export const codesIn = (registry: Registry, prefix: string): Code[] =>
  registry.codes.filter((code) => code.family === prefix);

/**
 * The id a family's row on the index carries, as the index has always named
 * it: `space--the-disk-and-letting-a-download-go`.
 */
export const familyAnchor = (family: Family): string =>
  `${family.prefix.toLowerCase()}--${family.covers
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

/** The codes of one severity, or that leave with one exit. */
export const codesWhere = (
  registry: Registry,
  which: { readonly severity?: Severity; readonly exit?: number },
): Code[] =>
  registry.codes.filter(
    (code) =>
      (which.severity === undefined || code.severity === which.severity) &&
      (which.exit === undefined || code.exit === which.exit),
  );

/** The id a code's row carries, so a link can land on it: `plugin-1`. */
export const anchorOf = (code: string): string => code.toLowerCase();

/** One run of an inline Markdown line, as it is rendered. */
export type Run =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "code"; readonly text: string }
  | { readonly kind: "link"; readonly text: string; readonly href: string };

/** A code span, or a link: the two marks the registry's text uses. */
const MARK = /`([^`]+)`|\[([^\]]{1,200})\]\(([^)\s]{1,500})\)/g;

/**
 * One line of the registry's Markdown as runs of text, code and links.
 *
 * The registry writes a link to this site whole, against `origin`. Such a link
 * is given as a path from the site's root, so it stays inside the version of
 * the site the reader is on; any other address is kept whole.
 */
export function runsOf(source: string, origin: string): Run[] {
  const local = (href: string): string =>
    href.startsWith(`${origin}/`) ? href.slice(origin.length) : href;
  const runs: Run[] = [];
  let from = 0;
  for (const mark of source.matchAll(MARK)) {
    if (mark.index > from)
      runs.push({ kind: "text", text: source.slice(from, mark.index) });
    const code = mark[1];
    runs.push(
      code === undefined
        ? {
            kind: "link",
            text: captured(mark, 2),
            href: local(captured(mark, 3)),
          }
        : { kind: "code", text: code },
    );
    from = mark.index + mark[0].length;
  }
  if (from < source.length)
    runs.push({ kind: "text", text: source.slice(from) });
  return runs;
}

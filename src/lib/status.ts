/**
 * What is built, read from the implementation status the binary's repository
 * keeps.
 *
 * That file is a section per milestone: a heading naming it and how far it has
 * got, a paragraph describing it, and a table with one row per deliverable
 * marked done, partial or not started, citing the requirements the row covers.
 * Counting those rows is what lets a page say how much of a feature exists,
 * rather than only what was planned.
 *
 * Every figure here is a count of marks the file carries. Nothing is weighted:
 * a number this site shows is one a reader can find in the file behind it.
 *
 * Pure functions over the file's text. Reading the checkout is
 * `project-source.ts`.
 */
import { plain } from "./markdown";
import { captured } from "./mirror";

/** How far along one thing is. */
export type Progress = "done" | "partial" | "todo";

/** One row of a milestone's table, or a heading that groups the rows under it. */
export interface Deliverable {
  readonly title: string;
  readonly status: Progress;
  /** The requirement the row cites, where it cites one. */
  readonly spec?: string;
  /** A grouping heading counts toward nothing; it only structures the list. */
  readonly group?: boolean;
}

/** How much of a set of parts exists. */
export interface Rollup {
  readonly done: number;
  readonly total: number;
  readonly pct: number;
  readonly status: Progress;
}

/** One milestone, with everything the status file says about it. */
export interface Milestone extends Rollup {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  readonly deliverables: readonly Deliverable[];
}

const MARKS: Record<string, Progress> = {
  "✅": "done",
  "◐": "partial",
  "☐": "todo",
};

/** The mark a line carries, if it carries one. */
export function markOf(line: string): Progress | null {
  for (const [mark, progress] of Object.entries(MARKS))
    if (line.includes(mark)) return progress;
  return null;
}

/** What a set of parts amounts to: all of them, some of them, or none. */
export function rollupStatus(done: number, total: number): Progress {
  if (total > 0 && done === total) return "done";
  return done === 0 ? "todo" : "partial";
}

const REQUIREMENT = /^[A-Z][A-Z\d]*-[A-Za-z]*\d/;

/** One table row as a deliverable, or nothing where the row is not one. */
export function rowToDeliverable(row: string): Deliverable | null {
  const [first, ...rest] = row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (first === undefined || rest.length === 0) return null;
  if (first === "" || /^-+$/.test(first.replace(/[:\s]/g, ""))) return null;
  if (/^deliverable$/i.test(first)) return null;

  let status: Progress | null = null;
  let spec: string | undefined;
  for (const cell of rest) {
    const mark = markOf(cell);
    if (mark !== null && status === null) {
      status = mark;
      continue;
    }
    const clean = plain(cell);
    if (spec === undefined && REQUIREMENT.test(clean))
      spec = clean.split(/[,·]/, 1).join("").trim();
  }

  return {
    title: plain(first),
    status: status ?? "todo",
    ...(spec === undefined ? {} : { spec }),
  };
}

/** A heading inside a milestone, which groups the rows beneath it. */
export function rowToGroup(row: string): Deliverable | null {
  const title = plain(row.slice(4)).replace(/^\d+\s*—\s*/, "");
  return title === "" ? null : { title, status: "todo", group: true };
}

/** One line of a milestone section, whichever of the two shapes it is. */
export function parseRow(row: string): Deliverable | null {
  if (row.startsWith("### ")) return rowToGroup(row);
  if (row.startsWith("|")) return rowToDeliverable(row);
  return null;
}

/**
 * What a set of rows adds up to, counted rather than weighted.
 *
 * A row is done or it is not. Giving a partial row a fraction of a unit would
 * put a number on this site that the file it came from does not contain.
 */
export function rollup(deliverables: readonly Deliverable[]): Rollup {
  const items = deliverables.filter((item) => item.group !== true);
  const done = items.filter((item) => item.status === "done").length;
  const total = items.length;
  return {
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    status: rollupStatus(done, total),
  };
}

const HEADING = /^##\s+(M[\d.]+)\s*—\s*(.+)$/;

/** The first line of a block of text. */
export function firstLine(text: string): string {
  return text.split("\n", 1).join("");
}

/** The heading's own text, with the trailing mark taken off the title. */
export function headingOf(line: string): { id: string; title: string } | null {
  const found = HEADING.exec(line);
  if (found === null) return null;
  const title = captured(found, 2)
    .replace(/\s*·\s*\S+\s*$/, "")
    .trim();
  return { id: captured(found, 1), title: plain(title) };
}

/**
 * The mark the milestone's own heading carries.
 *
 * A heading and the table under it answer different questions. The rows say
 * what has been recorded here; the heading says where the milestone stands,
 * including work recorded in another milestone's table. Where the two differ
 * the heading is the milestone's status, because it is the one written about
 * the milestone.
 */
export function declaredIn(line: string): Progress | null {
  return markOf(line);
}

/** The first paragraph under a heading, which describes the milestone. */
export function blurbOf(section: string): string {
  const lines = section.split("\n").slice(1);
  const paragraph: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("#") || line.startsWith("|") || line.startsWith("-"))
      break;
    if (line === "") {
      if (paragraph.length > 0) break;
      continue;
    }
    paragraph.push(line);
  }
  return plain(paragraph.join(" "));
}

/**
 * Every milestone the status file records, in the order it records them.
 *
 * A milestone whose work lives in another repository carries no table; it is
 * kept, with no deliverables, because leaving it out would renumber the list a
 * reader is following.
 */
export function parseStatus(source: string): Milestone[] {
  const found: Milestone[] = [];
  for (const section of source.split(/\n(?=##\s+M[\d.]+)/)) {
    const line = firstLine(section);
    const heading = headingOf(line);
    if (heading === null) continue;
    const deliverables: Deliverable[] = [];
    for (const line of section.split("\n")) {
      const parsed = parseRow(line.trim());
      if (parsed !== null) deliverables.push(parsed);
    }
    const counted = rollup(deliverables);
    found.push({
      ...heading,
      blurb: blurbOf(section),
      deliverables,
      ...counted,
      status: declaredIn(line) ?? counted.status,
    });
  }
  return found;
}

const REQUIREMENT_ID = /\b([A-Z]{1,3}\d*)-R(\d+)\b/g;
const REQUIREMENT_RANGE =
  /\b([A-Z]{1,3}\d*)-R(\d+)\.\.(?:[A-Z]{1,3}\d*-)?R?(\d+)\b/g;

/** Every requirement a line names, expanding `C9-R1..R6` into its members. */
export function requirementsIn(line: string): string[] {
  const ids = new Set<string>();
  for (const match of line.matchAll(REQUIREMENT_RANGE)) {
    const feature = captured(match, 1);
    const low = Number(captured(match, 2));
    const high = Number(captured(match, 3));
    for (let n = low; n <= high; n += 1) ids.add(`${feature}-R${String(n)}`);
  }
  for (const match of line.matchAll(REQUIREMENT_ID))
    ids.add(captured(match, 0));
  return [...ids];
}

/** The feature a requirement identifier belongs to: `C4-R12` is `C4`. */
export function featureOf(requirement: string): string {
  return requirement.replace(/-R\d+$/, "");
}

/** How much of one feature is built. */
export interface FeatureProgress extends Rollup {
  readonly id: string;
}

/**
 * What is built, per requirement.
 *
 * A table row marks every requirement it names. A requirement named on two rows
 * takes the better of them: it was covered somewhere. This is the finest grain
 * the file supports, and the grain the release gate reads it at.
 */
export function requirementProgress(source: string): Map<string, Progress> {
  const seen = new Map<string, Progress>();
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("|")) continue;
    const mark = markOf(line);
    if (mark === null) continue;
    for (const id of requirementsIn(line))
      if (seen.get(id) !== "done") seen.set(id, mark);
  }
  return seen;
}

/** What a set of requirement identifiers amounts to, given what is built. */
export function progressOver(
  requirements: readonly string[],
  built: ReadonlyMap<string, Progress>,
): Rollup {
  const done = requirements.filter((id) => built.get(id) === "done").length;
  const total = requirements.length;
  return {
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    status: rollupStatus(done, total),
  };
}

/**
 * What is built, per feature.
 *
 * A feature with some requirements done and others not is partial, which is the
 * common case for anything being worked on now.
 */
export function featureProgress(source: string): Map<string, FeatureProgress> {
  const byFeature = new Map<string, string[]>();
  const built = requirementProgress(source);
  for (const id of built.keys()) {
    const feature = featureOf(id);
    const carried = byFeature.get(feature) ?? [];
    carried.push(id);
    byFeature.set(feature, carried);
  }

  const found = new Map<string, FeatureProgress>();
  for (const [feature, ids] of byFeature)
    found.set(feature, { id: feature, ...progressOver(ids, built) });
  return found;
}

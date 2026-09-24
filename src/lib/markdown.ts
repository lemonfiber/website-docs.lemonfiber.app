/** Markdown taken back off text that is going to be rendered as plain words. */

const CODE = /`([^`]*)`/g;
const LINK = /\[([^\]]{1,200})\]\([^)]{0,500}\)/g;
const ESCAPE = /\\([\\`*_{}[\]()#+\-.!|])/g;
const RUNS = /\s+/g;

/**
 * One line of Markdown as a reader sees it.
 *
 * A link becomes its text, code and emphasis lose their marks, and an escape
 * becomes the character it was protecting. Runs of whitespace collapse, so
 * prose joined from several source lines reads as one sentence.
 */
export function plain(source: string): string {
  return source
    .replace(CODE, "$1")
    .replace(LINK, "$1")
    .replaceAll("**", "")
    .replace(ESCAPE, "$1")
    .replace(RUNS, " ")
    .trim();
}

/** One run of a paragraph: code, or words. */
export interface Span {
  readonly code: boolean;
  readonly text: string;
}

const FENCE = /(`[^`]*`)/;
const EMPHASIS = /\*([^*\s][^*]*)\*/g;

/**
 * A description as paragraphs of runs, so it renders with its code marked and
 * nothing else of the source taken as markup.
 *
 * A blank line ends a paragraph, as it does in the doc comment the text was
 * generated from. Inside one, a code span stays code and the rest reads as
 * `plain` would have it.
 */
export function paragraphs(source: string): Span[][] {
  return source
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .split(FENCE)
        .filter((run) => run.trim() !== "")
        .map((run) =>
          run.startsWith("`") && run.endsWith("`") && run.length > 1
            ? { code: true, text: run.slice(1, -1) }
            : { code: false, text: plainKeepingEdges(run) },
        ),
    )
    .filter((runs) => runs.length > 0);
}

/** A run as plain words, keeping the single space either side of it. */
const plainKeepingEdges = (run: string): string => {
  const words = plain(run).replace(EMPHASIS, "$1");
  const before = /^\s/.test(run) ? " " : "";
  const after = /\s$/.test(run) ? " " : "";
  return `${before}${words}${after}`;
};

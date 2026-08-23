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

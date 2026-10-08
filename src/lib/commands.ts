/**
 * Every `lemonfiber` command line a page prints, against the commands the
 * binary declares.
 *
 * The core generates `reference/commands/` from the command line's own
 * declarations: one section per command, each with its usage and the options it
 * takes. A page that tells a reader to type `lemonfiber <words> --<flag>` makes
 * two claims, that the command exists and that it takes the flag, and both go
 * false in the commit that renames either.
 *
 * Pure functions over text. Reading the tree is `scripts/guards.ts`.
 */

import type { Violation } from "@lemonfiber/website-kit/guards";

// Extension named: `scripts/guards.ts` loads this module in node directly,
// which resolves no extension of its own.
import { captured } from "@lemonfiber/website-kit/mirror";

import { at, lineAt, type Page } from "./counts.ts";

/** Where the reference is generated, relative to the core's checkout. */
export const REFERENCE = "vendor/lemonfiber/reference";

/** One command, as its section of the reference declares it. */
export interface Command {
  /** The words after `lemonfiber`, space-separated; empty for the root. */
  readonly path: string;
  /** Every option it takes, long and short. */
  readonly flags: ReadonlySet<string>;
  /** The options among them that take a value, as the next word. */
  readonly valued: ReadonlySet<string>;
  /**
   * Whether it takes a subcommand, and so no argument of its own: a bare word
   * after it must be a subcommand.
   */
  readonly group: boolean;
}

/** One command line a page prints, and where. */
export interface Invocation {
  readonly words: readonly string[];
  readonly index: number;
}

/** A fenced block: where it opens, the language it is marked as, and its lines. */
interface Fence {
  readonly index: number;
  readonly end: number;
  readonly language: string;
  /** Each line of the body, with where in the text it starts. */
  readonly lines: readonly { readonly text: string; readonly index: number }[];
}

const MARK = "```";

/**
 * Every fenced block in a text, read a line at a time: a line opening with the
 * mark opens one, and a line that is only the mark closes it.
 */
export function fencesIn(text: string): Fence[] {
  const fences: Fence[] = [];
  let open: {
    index: number;
    language: string;
    lines: Fence["lines"][number][];
  } | null = null;
  let index = 0;
  for (const line of text.split("\n")) {
    if (open === null) {
      if (line.startsWith(MARK))
        open = { index, language: languageOf(line), lines: [] };
    } else if (line.trimEnd() === MARK) {
      fences.push({ ...open, end: index + line.length });
      open = null;
    } else open.lines.push({ text: line, index });
    index += line.length + 1;
  }
  return fences;
}

/** The language a fence's opening line marks it as: the word after the mark. */
const languageOf = (line: string): string => {
  const rest = line.slice(MARK.length);
  let end = 0;
  while (end < rest.length && /[a-z]/.test(rest.charAt(end))) end += 1;
  return rest.slice(0, end);
};

/** What a usage line opens with. */
const USAGE = "Usage: lemonfiber";

/** A command's word, as clap prints it in a usage line. */
const WORD = /^[a-z][a-z0-9-]*$/;

/**
 * An option line: `      --stack-dir <PATH>`, or `  -h, --help`. Indented,
 * as clap prints it, so a word in a description never reads as one.
 */
const OPTION = /^ {2,6}(?:(-[A-Za-z]), )?(--[a-z][a-z0-9-]*)( <)?/;

/** The command one reference block declares, or null where it holds no usage. */
function commandOf(lines: readonly string[]): Command | null {
  const usage = lines.find((line) => line.startsWith(USAGE));
  if (usage === undefined) return null;
  const rest = usage.slice(USAGE.length).trim().split(" ");
  const words: string[] = [];
  for (const word of rest) {
    if (!WORD.test(word)) break;
    words.push(word);
  }
  return {
    path: words.join(" "),
    ...optionsIn(lines),
    group: rest.slice(words.length).some((word) => word.includes("COMMAND")),
  };
}

/** Every option a block's lines declare, and those among them that take a value. */
function optionsIn(lines: readonly string[]): {
  flags: Set<string>;
  valued: Set<string>;
} {
  const flags = new Set<string>();
  const valued = new Set<string>();
  for (const line of lines) {
    const option = OPTION.exec(line);
    if (option === null) continue;
    const names = [option[1], option[2]].filter(
      (name): name is string => name !== undefined,
    );
    for (const name of names) flags.add(name);
    if (option[3] !== undefined) for (const name of names) valued.add(name);
  }
  return { flags, valued };
}

/** Every command the reference files declare, by path. */
export function commandsIn(files: readonly string[]): Map<string, Command> {
  const commands = new Map<string, Command>();
  for (const file of files)
    for (const fence of fencesIn(file)) {
      if (fence.language !== "text") continue;
      const command = commandOf(fence.lines.map((line) => line.text));
      if (command !== null) commands.set(command.path, command);
    }
  return commands;
}

/** A code span. */
const SPAN = /`([^`\n]+)`/g;

/** The fences whose lines are commands a reader types. */
const SHELL = new Set(["sh", "bash", "shell", "console"]);

/**
 * `lemonfiber` as a command: at the start, or after something that ends one,
 * and followed by a space or the end.
 */
const CALLED = /(?:^|[\s;&|(])lemonfiber(?=\s|$)/g;

/** Where the words of a command end: a pipe, a redirect, a comment. */
const ENDS = /[;&|#>)]/;

const wordsAfter = (text: string): string[] => {
  const end = text.search(ENDS);
  return (end === -1 ? text : text.slice(0, end))
    .split(/\s+/)
    .filter((word) => word !== "" && word !== "\\");
};

/** The calls one line of a shell block makes, `offset` being where it starts. */
const calls = (line: string, offset: number): Invocation[] =>
  [...line.matchAll(CALLED)].map((call) => ({
    words: wordsAfter(line.slice(call.index + call[0].length)),
    index: offset + call.index,
  }));

/**
 * The lines of a shell block as a shell reads them: a line ending in `\`
 * carries on into the next.
 */
function logicalLines(fence: Fence): { text: string; index: number }[] {
  const joined: { text: string; index: number }[] = [];
  let carried: { text: string; index: number } | null = null;
  for (const line of fence.lines) {
    const current: { text: string; index: number } =
      carried === null
        ? { ...line }
        : { text: `${carried.text} ${line.text}`, index: carried.index };
    if (line.text.trimEnd().endsWith("\\")) carried = current;
    else {
      joined.push(current);
      carried = null;
    }
  }
  if (carried !== null) joined.push(carried);
  return joined;
}

/** The calls a shell block makes. In a `console` block, only after a `$` prompt. */
function shellCalls(fence: Fence): Invocation[] {
  const prompted = fence.language === "console";
  return logicalLines(fence).flatMap((line) => {
    if (!prompted) return calls(line.text, line.index);
    return line.text.startsWith("$ ")
      ? calls(line.text.slice(2), line.index + 2)
      : [];
  });
}

/**
 * Every command line a page prints: each line of a shell block (in a
 * `console` block, only the ones after a `$` prompt), and every code span that
 * begins with `lemonfiber `.
 */
export function invocationsIn(text: string): Invocation[] {
  const fences = fencesIn(text);
  const found = fences
    .filter((fence) => SHELL.has(fence.language))
    .flatMap(shellCalls);
  const inFence = (index: number): boolean =>
    fences.some((fence) => index >= fence.index && index < fence.end);
  for (const span of text.matchAll(SPAN)) {
    const code = captured(span, 1);
    if (inFence(span.index) || !code.startsWith("lemonfiber ")) continue;
    found.push({
      words: wordsAfter(code.slice("lemonfiber".length)),
      index: span.index,
    });
  }
  return found.toSorted((a, b) => a.index - b.index);
}

/** A word a reader replaces: `<PATH>`, `{name}`, `[NAME]`, or one with an ellipsis. */
const placeholder = (word: string): boolean =>
  /^[<{[]/.test(word) || word.includes("…") || word.includes("...");

/** A command as a reader types it. */
const named = (path: string): string =>
  path === "" ? "`lemonfiber`" : "`lemonfiber " + path + "`";

/** A flag as written, without a value given to it with `=`. */
const flagOf = (word: string): string => {
  const equals = word.indexOf("=");
  return equals === -1 ? word : word.slice(0, equals);
};

/** The command a line's words name, and the flags they give it, or what is wrong. */
function read(
  words: readonly string[],
  commands: ReadonlyMap<string, Command>,
): { path: string; flags: string[] } | string {
  let path = "";
  const flags: string[] = [];
  let settled = false;
  let value = false;
  for (const word of words) {
    if (value) value = false;
    else if (placeholder(word)) settled = true;
    else if (word.startsWith("-")) {
      flags.push(flagOf(word));
      // `--flag=value` carries its value, and is never in `valued` as written.
      value = commands.get(path)?.valued.has(word) === true;
    } else if (!settled) {
      const longer = path === "" ? word : `${path} ${word}`;
      if (commands.has(longer)) path = longer;
      else if (commands.get(path)?.group === true)
        return `${named(longer)} is no command: ${named(path)} has ${subcommandsOf(path, commands)}`;
    }
  }
  return { path, flags };
}

/** What is wrong with one command line, or null where nothing is. */
export function fault(
  words: readonly string[],
  commands: ReadonlyMap<string, Command>,
): string | null {
  const line = read(words, commands);
  if (typeof line === "string") return line;
  const command = commands.get(line.path);
  if (command === undefined) return `${named(line.path)} is no command`;
  const unknown = line.flags
    .filter((flag) => !command.flags.has(flag))
    .map((flag) => "`" + flag + "`");
  return unknown.length === 0
    ? null
    : `${named(line.path)} takes no ${unknown.join(", ")}`;
}

const subcommandsOf = (
  path: string,
  commands: ReadonlyMap<string, Command>,
): string => {
  const depth = path === "" ? 1 : path.split(" ").length + 1;
  const under = [...commands.keys()]
    .filter(
      (key) =>
        key !== "" &&
        key.split(" ").length === depth &&
        (path === "" || key.startsWith(path + " ")),
    )
    .map((key) => key.slice(key.lastIndexOf(" ") + 1))
    .toSorted((a, b) => a.localeCompare(b));
  return under.join(", ");
};

/**
 * Every command line on the pages that names a command the reference does not
 * declare, or an option that command does not take.
 *
 * An empty reference is a violation rather than a clean run: a checkout that
 * brought none would leave every line unchecked.
 */
export function commandViolations(
  commands: ReadonlyMap<string, Command>,
  pages: readonly Page[],
): Violation[] {
  if (!commands.has(""))
    return [
      at(
        REFERENCE,
        null,
        "declares no `lemonfiber` usage, so no command line can be checked",
      ),
    ];
  const found: Violation[] = [];
  for (const page of pages)
    for (const invocation of invocationsIn(page.text)) {
      const wrong = fault(invocation.words, commands);
      if (wrong !== null)
        found.push(at(page.path, lineAt(page.text, invocation.index), wrong));
    }
  return found;
}

/** The page that says where each recurring flag appears. */
export const FLAGS_PAGE = "src/content/docs/commands/global-flags.md";

/** A row naming a flag and, as code, the commands it appears on. */
const FLAG_ROW = /^\|\s*`(--[a-z][a-z0-9-]*)[^`]*`\s*\|([^|]*)\|/gm;

/** A command written as code in a cell. */
const COMMAND_CELL = /`([a-z][a-z0-9 -]*)`/g;

/**
 * The flags-page table of flags that recur without being inherited, against
 * every command that takes each one, in both directions. A row whose second
 * cell names no command as code is the global table's, and is left alone.
 */
export function flagTableViolations(
  commands: ReadonlyMap<string, Command>,
  pages: readonly Page[],
): Violation[] {
  const page = pages.find((one) => one.path === FLAGS_PAGE);
  if (page === undefined)
    return [
      at(
        FLAGS_PAGE,
        null,
        "the page saying where each flag appears is not here",
      ),
    ];
  const said = new Map<string, Set<string>>();
  for (const row of page.text.matchAll(FLAG_ROW)) {
    const named = [...captured(row, 2).matchAll(COMMAND_CELL)].map((cell) =>
      captured(cell, 1),
    );
    if (named.length === 0) continue;
    const flag = captured(row, 1);
    said.set(flag, new Set([...(said.get(flag) ?? []), ...named]));
  }
  const found: Violation[] = [];
  for (const [flag, onPage] of said) {
    const taking = [...commands.values()]
      .filter((command) => command.path !== "" && command.flags.has(flag))
      .map((command) => command.path);
    const missing = taking.filter((path) => !onPage.has(path));
    const invented = [...onPage].filter((path) => !taking.includes(path));
    if (missing.length > 0)
      found.push(
        at(
          FLAGS_PAGE,
          null,
          `\`${flag}\` is also taken by ${missing.join(", ")}`,
        ),
      );
    if (invented.length > 0)
      found.push(
        at(
          FLAGS_PAGE,
          null,
          `\`${flag}\` is not taken by ${invented.join(", ")}`,
        ),
      );
  }
  return found;
}

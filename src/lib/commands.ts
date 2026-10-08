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

const USAGE = /^Usage: lemonfiber((?: [a-z][a-z0-9-]*)*)(.*)$/m;

/**
 * An option line: `      --stack-dir <PATH>`, or `  -h, --help`. Indented,
 * as clap prints it, so a word in a description never reads as one.
 */
const OPTION = /^ {2,6}(?:(-[A-Za-z]), )?(--[a-z][a-z0-9-]*)( <)?/gm;

/** Each fenced block of a reference file. */
const BLOCK = /^```text\n([\s\S]*?)^```$/gm;

/** Every command the reference files declare, by path. */
export function commandsIn(files: readonly string[]): Map<string, Command> {
  const commands = new Map<string, Command>();
  for (const file of files)
    for (const block of file.matchAll(BLOCK)) {
      const text = captured(block, 1);
      const usage = USAGE.exec(text);
      if (usage === null) continue;
      const flags = new Set<string>();
      const valued = new Set<string>();
      for (const option of text.matchAll(OPTION)) {
        const names = [option[1], option[2]].filter(
          (name): name is string => name !== undefined,
        );
        for (const name of names) {
          flags.add(name);
          if (option[3] !== undefined) valued.add(name);
        }
      }
      const path = captured(usage, 1).trim();
      commands.set(path, {
        path,
        flags,
        valued,
        group: captured(usage, 2).includes("COMMAND"),
      });
    }
  return commands;
}

/** A fenced block in a page, with the language it is marked as. */
const FENCED = /^```([a-z]*)[^\n]*\n([\s\S]*?)^```$/gm;

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
 * Every command line a page prints: each line of a shell block (in a
 * `console` block, only the ones after a `$` prompt), and every code span that
 * begins with `lemonfiber `.
 */
export function invocationsIn(text: string): Invocation[] {
  const found: Invocation[] = [];
  const fenced: [number, number][] = [];
  for (const block of text.matchAll(FENCED)) {
    fenced.push([block.index, block.index + block[0].length]);
    const language = captured(block, 1);
    if (!SHELL.has(language)) continue;
    const body = captured(block, 2);
    let offset = block.index + block[0].indexOf("\n") + 1;
    for (const line of body.split("\n")) {
      const typed =
        language === "console"
          ? line.startsWith("$ ")
            ? line.slice(2)
            : null
          : line;
      if (typed !== null)
        found.push(...calls(typed, offset + line.length - typed.length));
      offset += line.length + 1;
    }
  }
  const inFence = (index: number): boolean =>
    fenced.some(([start, end]) => index >= start && index < end);
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

/** A word a reader replaces: `<PATH>`, `{name}`, `…`. */
const PLACEHOLDER = /^[<{[]|…|\.\.\./;

/** A command as a reader types it. */
const named = (path: string): string =>
  path === "" ? "`lemonfiber`" : `\`lemonfiber ${path}\``;

/** What is wrong with one command line, or null where nothing is. */
export function fault(
  words: readonly string[],
  commands: ReadonlyMap<string, Command>,
): string | null {
  let path = "";
  const flags: string[] = [];
  let settled = false;
  let value = false;
  for (const word of words) {
    if (value) {
      value = false;
      continue;
    }
    if (PLACEHOLDER.test(word)) {
      settled = true;
      continue;
    }
    if (word.startsWith("-")) {
      const equals = word.indexOf("=");
      const flag = equals === -1 ? word : word.slice(0, equals);
      flags.push(flag);
      value = equals === -1 && commands.get(path)?.valued.has(flag) === true;
      continue;
    }
    if (settled) continue;
    const longer = path === "" ? word : `${path} ${word}`;
    if (commands.has(longer)) path = longer;
    else if (commands.get(path)?.group === true)
      return `${named(longer)} is no command: ${named(path)} has ${subcommandsOf(path, commands)}`;
  }
  const command = commands.get(path);
  if (command === undefined) return `${named(path)} is no command`;
  const unknown = flags.filter((flag) => !command.flags.has(flag));
  return unknown.length === 0
    ? null
    : `${named(path)} takes no ${unknown.map((flag) => `\`${flag}\``).join(", ")}`;
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
        (path === "" || key.startsWith(`${path} `)),
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

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  commandsIn,
  commandViolations,
  fault,
  invocationsIn,
  REFERENCE,
} from "./commands.ts";
import type { Page } from "./counts.ts";

const section = (usage: string, options: string): string =>
  [
    "## heading",
    "",
    "```text",
    "What it does.",
    "",
    usage,
    "",
    "Options:",
    options,
    "```",
    "",
  ].join("\n");

const ROOT = section(
  "Usage: lemonfiber [OPTIONS] [COMMAND]",
  [
    "      --stack-dir <PATH>",
    "          Operate a stack directory of your own",
    "",
    "  -h, --help",
    "          Print help",
    "",
    "  -V, --version",
  ].join("\n"),
);

const UP = section(
  "Usage: lemonfiber up [OPTIONS] [FORMS]...",
  [
    "      --dry-run",
    "          Say what would happen, and change nothing (--not-a-flag)",
    "          --everything-else is refused",
    "      --service <ID>",
    "      --stack-dir <PATH>",
  ].join("\n"),
);

const PLUGIN = section(
  "Usage: lemonfiber plugin [OPTIONS] <COMMAND>",
  "      --json",
);

const INSTALL = section(
  "Usage: lemonfiber plugin install [OPTIONS] <SOURCE>",
  "      --dry-run\n      --approve <VALUE@DESTINATION>",
);

const HOUSEHOLD = section(
  "Usage: lemonfiber household [OPTIONS] [COMMAND]",
  "      --member <NAME>",
);

const HANDOFF = section(
  "Usage: lemonfiber household handoff [OPTIONS] [NAME]",
  "      --json",
);

const COMMANDS = commandsIn([
  ROOT,
  `${UP}\n${PLUGIN}`,
  INSTALL,
  HOUSEHOLD,
  HANDOFF,
]);

const page = (text: string, path = "src/content/docs/a.md"): Page => ({
  path,
  text,
});

describe("commandsIn", () => {
  it("reads each section's path, options and whether it takes a subcommand", () => {
    expect([...COMMANDS.keys()].toSorted()).toEqual([
      "",
      "household",
      "household handoff",
      "plugin",
      "plugin install",
      "up",
    ]);
    expect(COMMANDS.get("")).toMatchObject({ group: true });
    expect([...(COMMANDS.get("")?.flags ?? [])].toSorted()).toEqual([
      "--help",
      "--stack-dir",
      "--version",
      "-V",
      "-h",
    ]);
    expect([...(COMMANDS.get("")?.valued ?? [])]).toEqual(["--stack-dir"]);
    expect(COMMANDS.get("up")).toMatchObject({ group: false });
    expect(COMMANDS.get("up")?.flags.has("--not-a-flag")).toBe(false);
    expect(COMMANDS.get("up")?.flags.has("--everything-else")).toBe(false);
    expect(COMMANDS.get("plugin")).toMatchObject({ group: true });
    expect(COMMANDS.get("household")).toMatchObject({ group: true });
  });

  it("skips a block that is no usage", () => {
    expect(commandsIn(["```text\nno usage here\n```\n"]).size).toBe(0);
  });

  it("reads the reference the pinned core generates", () => {
    const directory = join(REFERENCE, "commands");
    const files = [
      readFileSync(`${REFERENCE}/commands.md`, "utf8"),
      ...readdirSync(directory).map((name) =>
        readFileSync(join(directory, name), "utf8"),
      ),
    ];
    const read = commandsIn(files);
    expect(read.get("")?.group).toBe(true);
    expect(read.get("plugin install")?.flags.has("--dry-run")).toBe(true);
  });
});

describe("invocationsIn", () => {
  it("reads shell lines, prompted console lines and code spans", () => {
    const text = [
      "Run `lemonfiber up tv` first, not `lemonfiber-installer.sh`.",
      "",
      "```sh",
      "$ lemonfiber --stack-dir ./mine ps | less",
      "lemonfiber doctor # all of it",
      "lemonfiber up \\",
      "  --dry-run",
      "```",
      "",
      "```console",
      "$ lemonfiber version",
      "  lemonfiber 0.17.0 is what you have",
      "```",
      "",
      "```toml",
      "lemonfiber up = 1",
      'note = "`lemonfiber down`"',
      "```",
      "",
      "After: `lemonfiber plugin`.",
    ].join("\n");
    const found = invocationsIn(text);
    expect(found.map((one) => one.words)).toEqual([
      ["up", "tv"],
      ["--stack-dir", "./mine", "ps"],
      ["doctor"],
      ["up"],
      ["version"],
      ["plugin"],
    ]);
    expect(
      text.slice(found[1]?.index).trimStart().startsWith("lemonfiber --stack"),
    ).toBe(true);
    expect(
      text.slice(found[4]?.index).trimStart().startsWith("lemonfiber version"),
    ).toBe(true);
  });
});

describe("fault", () => {
  it("passes a command, its flags and its arguments", () => {
    expect(fault(["up", "tv", "--dry-run"], COMMANDS)).toBeNull();
    expect(fault(["up", "--service", "sonarr", "tv"], COMMANDS)).toBeNull();
    expect(fault(["--stack-dir", "./mine", "up"], COMMANDS)).toBeNull();
    expect(fault(["--stack-dir=./mine", "up"], COMMANDS)).toBeNull();
    expect(fault(["household", "--member", "ana"], COMMANDS)).toBeNull();
    expect(fault(["plugin", "install", "<SOURCE>", "x"], COMMANDS)).toBeNull();
    expect(fault(["--version"], COMMANDS)).toBeNull();
    expect(fault(["plugin"], COMMANDS)).toBeNull();
    expect(fault(["household", "{name}", "ana"], COMMANDS)).toBeNull();
  });

  it("names a command that is not one, and what is there instead", () => {
    expect(fault(["bogus"], COMMANDS)).toBe(
      "`lemonfiber bogus` is no command: `lemonfiber` has household, plugin, up",
    );
    expect(fault(["plugin", "instal"], COMMANDS)).toBe(
      "`lemonfiber plugin instal` is no command: `lemonfiber plugin` has install",
    );
  });

  it("stops reading a command at the first word a reader fills in", () => {
    expect(
      fault(["plugin", "<SOURCE>", "install", "--approve"], COMMANDS),
    ).toBe("`lemonfiber plugin` takes no `--approve`");
  });

  it("reads a value given with `=` as part of its flag", () => {
    expect(fault(["household", "--member=ana", "bogus"], COMMANDS)).toBe(
      "`lemonfiber household bogus` is no command: `lemonfiber household` has handoff",
    );
  });

  it("names every flag the command does not take", () => {
    expect(fault(["up", "--fast", "--dry-run", "-q"], COMMANDS)).toBe(
      "`lemonfiber up` takes no `--fast`, `-q`",
    );
    expect(fault(["-q"], COMMANDS)).toBe("`lemonfiber` takes no `-q`");
    expect(fault([], new Map())).toBe("`lemonfiber` is no command");
  });

  it("reads a flag's value as the next word only where the flag takes one", () => {
    expect(fault(["up", "--dry-run", "plugin"], COMMANDS)).toBeNull();
    expect(fault(["household", "--member", "bogus"], COMMANDS)).toBeNull();
  });
});

describe("commandViolations", () => {
  it("reports each wrong line where it stands", () => {
    const found = commandViolations(COMMANDS, [
      page("Fine: `lemonfiber up`.\n\nNot: `lemonfiber up --fast`.\n"),
    ]);
    expect(found).toEqual([
      {
        where: "src/content/docs/a.md",
        line: 3,
        message: "`lemonfiber up` takes no `--fast`",
      },
    ]);
  });

  it("refuses a reference with no root usage", () => {
    expect(commandViolations(new Map(), [page("`lemonfiber up`")])).toEqual([
      expect.objectContaining({ where: REFERENCE, line: null }),
    ]);
  });
});

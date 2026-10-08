import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { countViolations, type Page, type Sources } from "./counts.ts";
import { contract } from "./schema-source.ts";
import { joinedStack, STACK_CHECKOUT, STACK_ROOT } from "./stack.ts";
import { GLOSSARY, INVENTORIES } from "./inventories.ts";
import {
  consolePlaces,
  formServices,
  glossaryWords,
  keysAt,
  namesAt,
  offered,
  releaseTargets,
  required,
  thirdParty,
  variantsAt,
} from "./sources.ts";

/** Every real file under a directory, symlinked trees left where they are. */
const walk = (dir: string, keep: (path: string) => boolean): string[] => {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) found.push(...walk(path, keep));
    else if (keep(path)) found.push(path);
  }
  return found;
};

const read = (path: string): string => readFileSync(path, "utf8");

const theTree = (): { sources: Sources; pages: Page[] } => ({
  sources: {
    stack: joinedStack(read(`${STACK_CHECKOUT}/${STACK_ROOT}`), (entry) =>
      read(`${STACK_CHECKOUT}/${entry}`),
    ),
    contract: JSON.stringify(contract()),
    commands: read("vendor/lemonfiber/reference/commands.md"),
    quality: read("vendor/lemonfiber/reference/commands/quality.md"),
    extensionPoints: read("vendor/lemonfiber/contract/extension-points.json"),
    template: read("vendor/plugin-template/plugin.toml"),
    vocabulary: read("vendor/lemonfiber/contract/capability-vocabulary.json"),
    webApi: read("vendor/spec/20-architecture/contracts/web-api.md"),
    webRoute: read("vendor/lemonfiber-web/src/lib/route.ts"),
    workspace: read("vendor/lemonfiber/Cargo.toml"),
    glossary: read(GLOSSARY),
  },
  pages: walk("src/content/docs", (path) => /\.(md|mdx)$/.test(path)).map(
    (path) => ({ path, text: read(path) }),
  ),
});

const nothing: Sources = {
  stack: "",
  contract: "",
  commands: "",
  quality: "",
  extensionPoints: "",
  template: "",
  vocabulary: "",
  webApi: "",
  webRoute: "",
  workspace: "",
  glossary: "",
};

describe("the tree as it stands", () => {
  it("states no number the trees it renders disagree with", () => {
    const { sources, pages } = theTree();
    expect(countViolations(INVENTORIES, sources, pages)).toEqual([]);
  });

  it("derives every count from something, and nothing from nowhere", () => {
    const { sources, pages } = theTree();
    for (const inventory of INVENTORIES)
      expect({
        what: inventory.what,
        members: inventory.members(sources, pages).length,
      }).toEqual({ what: inventory.what, members: expect.any(Number) });
    expect(
      INVENTORIES.every(
        (inventory) => inventory.members(sources, pages).length > 0,
      ),
    ).toBe(true);
  });
});

describe("a tree with nothing in it", () => {
  it("reports every inventory as unreadable rather than as agreeing", () => {
    const found = countViolations(INVENTORIES, nothing, []);
    const sources = found.filter((one) =>
      one.message.includes("missing or unreadable"),
    );
    expect(sources).toHaveLength(INVENTORIES.length);
  });
});

describe("a generated reference with one section and no more", () => {
  it("reads the subcommands and the global flags out of it", () => {
    const commands = [
      "# `lemonfiber` — command reference",
      "",
      "## `lemonfiber`",
      "",
      "```text",
      "Commands:",
      "  ship         Ships it",
      "  help         Print this message",
      "",
      "Options:",
      "      --json",
      "          Print machine-readable output",
      "  -h, --help",
      "          Print help",
      "  -V, --version",
      "          Print version",
      "```",
      "",
    ].join("\n");

    const found = countViolations(INVENTORIES, { ...nothing, commands }, [
      { path: "src/content/docs/p.md", text: "the one global flags" },
    ]);
    expect(
      found.some((one) => one.message.includes("no subcommands found")),
    ).toBe(false);
    expect(
      found.some((one) => one.message.includes("no global flags found")),
    ).toBe(false);
    expect(
      found.some((one) => one.message.includes("no quality presets found")),
    ).toBe(true);
  });
});

describe("a contract that has gained a read endpoint", () => {
  const ENVELOPE = "src/content/docs/api/the-envelope.mdx";

  const webApi = [
    "# The web API",
    "",
    "## Reading",
    "",
    "```",
    "GET /api/status        GET /api/version",
    "```",
    "",
    "## Live state",
    "",
  ].join("\n");

  const page = (rows: readonly string[]): Page => ({
    path: ENVELOPE,
    text: [
      "Two endpoints answer a question and close.",
      "",
      "| Endpoint | What it answers |",
      "| -------- | --------------- |",
      ...rows,
      "",
    ].join("\n"),
  });

  const about = (rows: readonly string[]): string[] =>
    countViolations(INVENTORIES, { ...nothing, webApi }, [page(rows)])
      .filter((one) => one.where === ENVELOPE)
      .map((one) => one.message);

  it("names the endpoint the page has not caught up with", () => {
    expect(about(["| `GET /api/status` | What the stack is doing |"])).toEqual([
      expect.stringContaining("has these and the page does not: version"),
    ]);
  });

  it("names one the page sets out that the contract does not", () => {
    expect(
      about([
        "| `GET /api/status` | What the stack is doing |",
        "| `GET /api/version` | The versions in play |",
        "| `GET /api/rumour` | Something nothing serves |",
      ]),
    ).toEqual([expect.stringContaining("the page has these and")]);
  });

  it("says nothing where the page sets out exactly what the contract does", () => {
    expect(
      about([
        "| `GET /api/status` | What the stack is doing |",
        "| `GET /api/version` | The versions in play |",
      ]),
    ).toEqual([]);
  });

  it("counts an endpoint once where the section names it again under its own heading", () => {
    const described = webApi.replace(
      "## Live state",
      [
        "### What the version is",
        "",
        "```",
        "GET /api/version",
        "```",
        "",
        "## Live state",
      ].join("\n"),
    );
    expect(
      countViolations(INVENTORIES, { ...nothing, webApi: described }, [
        page([
          "| `GET /api/status` | What the stack is doing |",
          "| `GET /api/version` | The versions in play |",
        ]),
      ]).filter((one) => one.where === ENVELOPE),
    ).toEqual([]);
  });
});

describe("namesAt", () => {
  it("names every entry of the array at a path", () => {
    expect(
      namesAt(
        '{"points": [{"name": "a"}, {"name": 2}, 3, null, {"name": "b"}]}',
        "points",
      ),
    ).toEqual(["a", "b"]);
  });

  it("finds nothing where the path does not lead to an array", () => {
    expect(namesAt('{"points": {}}', "points")).toEqual([]);
  });
});

describe("keysAt", () => {
  it("reads the keys of the object a path leads to", () => {
    expect(keysAt('{"a": {"b": {"c": 1, "d": 2}}}', "a", "b")).toEqual([
      "c",
      "d",
    ]);
  });

  it("reads nothing out of a path that stops at a value", () => {
    expect(keysAt('{"a": 1}', "a", "b")).toEqual([]);
  });

  it("reads nothing out of a path that leads to a value", () => {
    expect(keysAt('{"a": 1}', "a")).toEqual([]);
  });

  it("reads nothing out of a document that will not parse", () => {
    expect(keysAt("{", "a")).toEqual([]);
  });
});

describe("variantsAt", () => {
  it("reads a variant that names itself at the top of its branch", () => {
    expect(
      variantsAt(
        '{"S": {"oneOf": [{"const": "warn"}, {"const": "fail"}]}}',
        "S",
      ),
    ).toEqual(["warn", "fail"]);
  });

  it("reads one that names itself under the field discriminating it", () => {
    expect(
      variantsAt(
        '{"V": {"oneOf": [{"properties": {"note": {"type": "string"}, "outcome": {"const": "pass"}}}]}}',
        "V",
      ),
    ).toEqual(["pass"]);
  });

  it("passes over a branch that names itself nowhere", () => {
    expect(
      variantsAt(
        '{"V": {"oneOf": [{"type": "string"}, {"const": "one"}]}}',
        "V",
      ),
    ).toEqual(["one"]);
  });

  it("reads nothing out of a path that leads to no schema", () => {
    expect(variantsAt('{"a": 1}', "a")).toEqual([]);
  });

  it("reads nothing out of a schema that is not a choice", () => {
    expect(variantsAt('{"a": {"type": "string"}}', "a")).toEqual([]);
  });
});

describe("glossaryWords", () => {
  it("reads the word each entry opens with", () => {
    const glossary = [
      "pub const TERMS: &[Term] = &[",
      "    Term::new(",
      '        "indexer",',
      '        "Search engines.",',
      "    ),",
      '    Term::new("NZB", "What the indexer hands over."),',
      "];",
    ].join("\n");
    expect(glossaryWords(glossary)).toEqual(["indexer", "NZB"]);
  });
});

describe("releaseTargets", () => {
  it("reads the targets the workspace names to cargo-dist", () => {
    expect(
      releaseTargets(
        '[workspace.metadata.dist]\ntargets = ["x86_64-apple-darwin"]\n',
      ),
    ).toEqual(["x86_64-apple-darwin"]);
  });

  it("reads none where the workspace names none, or does not parse", () => {
    expect(releaseTargets("[workspace]\n")).toEqual([]);
    expect(releaseTargets("[workspace.metadata.dist]\ntargets = 3\n")).toEqual(
      [],
    );
    expect(releaseTargets("= not toml")).toEqual([]);
  });
});

describe("formServices", () => {
  const stack = [
    "[[form]]",
    'id = "search"',
    'profiles = ["search"]',
    "",
    "[[form]]",
    'id = "odd"',
    'profiles = "search"',
    "",
    "[[service]]",
    'id = "prowlarr"',
    'profile = "search"',
    "",
    "[[service]]",
    'id = "sonarr"',
    'profile = "tv"',
    "",
  ].join("\n");

  it("names the services whose profile is in the form's closure", () => {
    expect(formServices(stack, "search")).toEqual(["prowlarr"]);
  });

  it("names none for a form the stack does not declare as one", () => {
    expect(formServices(stack, "missing")).toEqual([]);
    expect(formServices(stack, "odd")).toEqual([]);
    expect(formServices("= not toml", "search")).toEqual([]);
    expect(formServices('form = "x"', "search")).toEqual([]);
  });
});

describe("thirdParty", () => {
  const own = ["https:", "//github.com/lemonfiber/lemonfiber-decline"].join("");
  const theirs = ["https:", "//github.com/Jellyfin/jellyfin"].join("");

  it("names the services whose upstream is outside the org", () => {
    const stack = [
      "[[form]]",
      'id = "library"',
      "",
      "[[service]]",
      'id = "jellyfin"',
      `upstream = "${theirs}"`,
      "",
      "[[service]]",
      'id = "decline"',
      `upstream = "${own}"`,
      "",
    ].join("\n");
    expect(thirdParty(stack)).toEqual(["jellyfin"]);
  });

  it("takes an upstream that is not an address as nobody's in the org", () => {
    expect(
      thirdParty('[[service]]\nid = "odd"\nupstream = "elsewhere"\n'),
    ).toEqual(["odd"]);
  });

  it("passes over a service that names no upstream or no id", () => {
    const stack = [
      "[[service]]",
      'id = "nameless"',
      "",
      "[[service]]",
      `upstream = "${theirs}"`,
      "",
    ].join("\n");
    expect(thirdParty(stack)).toEqual([]);
  });
});

describe("consolePlaces", () => {
  const route = `export const everyPlace: readonly Place[] = [
  "overview",
  "checks",
  "requests",
];`;

  it("reads the screens in the order the menu shows them", () => {
    expect(consolePlaces(route)).toEqual(["overview", "checks", "requests"]);
  });

  it("gives nothing where the list is not declared", () => {
    expect(consolePlaces("export const somethingElse = [];")).toEqual([]);
  });

  it("gives nothing for a file it cannot read", () => {
    expect(consolePlaces("")).toEqual([]);
  });
});

describe("what the plugin template asks of this build", () => {
  const PAGE = "src/content/docs/plugins/the-manifest.mdx";
  const template = [
    "[requires]",
    'capabilities = ["service.add", "doctor.contribute", 3]',
  ].join("\n");
  const extensionPoints = JSON.stringify({
    points: [
      { name: "doctor.check", requires: "doctor.contribute" },
      { name: "doctor.remedy", requires: "doctor.contribute" },
      { name: "other" },
      null,
    ],
  });
  const about = (text: string, sources: Partial<Sources> = {}): string[] =>
    countViolations(
      INVENTORIES,
      { ...nothing, template, extensionPoints, ...sources },
      [{ path: PAGE, text }],
    )
      .filter((one) => one.where === PAGE)
      .map((one) => one.message);

  const SAYS =
    "Its `[requires]` names `service.add` and\n`doctor.contribute`. The lemonfiber this site pins offers\n`doctor.contribute` and nothing else.";

  it("says nothing where the page names what the template requires and what the build offers", () => {
    expect(about(SAYS)).toEqual([]);
  });

  it("names a capability the template requires that the page has dropped", () => {
    expect(about(SAYS.replace("`service.add` and\n", ""))).toEqual([
      expect.stringContaining("has these and the page does not: service.add"),
    ]);
  });

  it("names a capability the build now offers that the page does not say", () => {
    const more = JSON.stringify({
      points: [
        { name: "doctor.check", requires: "doctor.contribute" },
        { name: "service.add", requires: "service.add" },
      ],
    });
    expect(about(SAYS, { extensionPoints: more })).toEqual([
      expect.stringContaining("has these and the page does not: service.add"),
    ]);
  });

  it("finds nothing where either sentence has been reworded", () => {
    expect(about("The template asks for things.")).toHaveLength(2);
    expect(about("Its `[requires]` names `x` and stops.")).toHaveLength(2);
  });

  it("reads nothing out of a manifest that is not one", () => {
    expect(required("= not toml")).toEqual([]);
    expect(required('requires = "x"')).toEqual([]);
    expect(offered("{}")).toEqual([]);
  });
});

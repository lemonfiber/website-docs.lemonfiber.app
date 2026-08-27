import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { countViolations, type Page, type Sources } from "./counts.ts";
import { INVENTORIES } from "./inventories.ts";
import { exportedBy, keysAt, variantsAt } from "./sources.ts";

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
    stack: read("vendor/lemonfiber-media-stack/stack.toml"),
    contract: read("vendor/lemonfiber/contract/web-api.contract.json"),
    commands: read("vendor/lemonfiber/reference/commands.md"),
    webApi: read("vendor/spec/20-architecture/contracts/web-api.md"),
    mirrors: read("mirrors.json"),
    clientIndex: read("vendor/sdk-ts/src/index.ts"),
    webManifest: read("vendor/lemonfiber-web/package.json"),
    phpContract: read("vendor/sdk-php/contract/web-api.contract.json"),
    tsContract: read("vendor/sdk-ts/contract/web-api.contract.json"),
    spec: walk("vendor/spec", () => true),
  },
  pages: walk("src/content/docs", (path) => /\.(md|mdx)$/.test(path)).map(
    (path) => ({ path, text: read(path) }),
  ),
});

const nothing: Sources = {
  stack: "",
  contract: "",
  commands: "",
  webApi: "",
  mirrors: "",
  clientIndex: "",
  webManifest: "",
  phpContract: "",
  tsContract: "",
  spec: [],
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
  const ENVELOPE = "src/content/docs/api/the-envelope.md";

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
});

describe("a manifest that is not what it should be", () => {
  const repos = (mirrors: string): number =>
    countViolations(INVENTORIES, { ...nothing, mirrors }, []).filter((one) =>
      one.message.includes("no repositories this site renders found"),
    ).length;

  it("reads nothing out of one that is not an object", () => {
    expect(repos("[1, 2]")).toBe(1);
  });

  it("reads nothing out of one whose mirrors are not a list", () => {
    expect(repos('{"mirrors": "some"}')).toBe(1);
  });

  it("reads the repositories out of one that is", () => {
    expect(
      repos('{"mirrors": [{"repo": "a"}, {"repo": "a"}, {"repo": "b"}]}'),
    ).toBe(0);
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

describe("exportedBy", () => {
  const index = [
    'export { address, type Address } from "./address.js";',
    "export {",
    "  Client,",
    "  refusalIn,",
    "  type Opened,",
    '} from "./client.js";',
  ].join("\n");

  it("names every export, whichever line it is written on", () => {
    expect(exportedBy(index)).toEqual([
      "address",
      "Address",
      "Client",
      "refusalIn",
      "Opened",
    ]);
  });

  // A type and a value are both something a consumer imports by name, and the
  // page lists them in one column.
  it("does not keep the word saying a name is a type", () => {
    expect(exportedBy(index)).not.toContain("type Address");
  });

  it("names nothing where an entry point re-exports nothing", () => {
    expect(exportedBy('export * from "./everything.js";')).toEqual([]);
  });
});

describe("what the web surface consumes", () => {
  const MAP = "src/content/docs/develop/repo-map.md";

  const webManifest = JSON.stringify({
    dependencies: {
      "@lemonfiber/brand": "github:lemonfiber/brand#abc",
      "@lemonfiber/sdk-ts": "github:lemonfiber/sdk-ts#def",
    },
    devDependencies: { svelte: "^5" },
  });

  const about = (text: string, manifest = webManifest): string[] =>
    countViolations(INVENTORIES, { ...nothing, webManifest: manifest }, [
      { path: MAP, text },
    ])
      .filter((one) => one.where === MAP)
      .map((one) => one.message);

  const SAYS = "**`lemonfiber-web` consumes `sdk-ts` and `brand`**, and is";

  it("says nothing where the map names exactly what the manifest requires", () => {
    expect(about(SAYS)).toEqual([]);
  });

  it("names the one the map has dropped", () => {
    expect(about("**`lemonfiber-web` consumes `sdk-ts`**, and is")).toEqual([
      expect.stringContaining("has these and the page does not: brand"),
    ]);
  });

  it("names one the map states that the manifest does not require", () => {
    expect(
      about(
        "**`lemonfiber-web` consumes `sdk-ts`, `brand` and `svelte`**, and",
      ),
    ).toEqual([expect.stringContaining("the page has these and")]);
  });

  it("finds nothing where the sentence has been reworded", () => {
    expect(
      about("**`lemonfiber-web` is built on the client and the tokens**"),
    ).toEqual([
      expect.stringContaining("has these and the page does not: brand, sdk-ts"),
    ]);
  });

  it("keeps the name of a dependency from outside the org", () => {
    expect(
      about(SAYS, JSON.stringify({ dependencies: { svelte: "^5" } })),
    ).toEqual([
      expect.stringContaining("has these and the page does not: svelte"),
      expect.stringContaining("the page has these and"),
    ]);
  });
});

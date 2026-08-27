import { describe, expect, it } from "vitest";

import { ARTEFACT } from "./codes.ts";
import { FORMULAE } from "./formula.ts";
import { INVENTORIES } from "./inventories.ts";
import { TOKENS } from "./tokens.ts";
import {
  declaredBranches,
  GUARDED,
  parseCommits,
  pinnedRevisions,
  report,
  unread,
  watched,
  type Behind,
} from "./pins.ts";

const MODULES = ["vendor/spec", "vendor/lemonfiber", "vendor/lemonfiber/dep"];

const commit = (sha: string): Behind["commits"][number] => ({
  sha,
  date: "2026-08-25",
  subject: `feat: ${sha}`,
});

describe("what a guard reads", () => {
  it("takes every inventory's source and the error-code artefact", () => {
    expect(GUARDED).toContain(ARTEFACT);
    for (const inventory of INVENTORIES)
      expect(GUARDED).toContain(inventory.source);
  });

  it("names each source once, however many inventories declare it", () => {
    expect(new Set(GUARDED).size).toBe(GUARDED.length);
  });

  it("holds what the guards that are not inventories read", () => {
    const sources = INVENTORIES.map((one) => one.source);
    for (const artefact of [ARTEFACT, FORMULAE, TOKENS]) {
      expect(sources).not.toContain(artefact);
      expect(GUARDED).toContain(artefact);
    }
  });

  it("reaches into the tap, which held no guarded path before", () => {
    expect(watched(GUARDED, ["vendor/homebrew-tap"])).toEqual([
      { module: "vendor/homebrew-tap", path: "Formula" },
    ]);
  });

  it("reaches into brand, which held no guarded path before", () => {
    expect(watched(GUARDED, ["vendor/brand"])).toEqual([
      { module: "vendor/brand", path: "tokens/tokens.css" },
    ]);
  });

  it("reaches into the web surface, which held no guarded path before", () => {
    expect(watched(GUARDED, ["vendor/lemonfiber-web"])).toEqual([
      { module: "vendor/lemonfiber-web", path: "package.json" },
    ]);
  });

  it("watches the artefact that made a page wrong while its guard stayed green", () => {
    expect(watched(GUARDED, ["vendor/lemonfiber"])).toContainEqual({
      module: "vendor/lemonfiber",
      path: "reference/error-codes.md",
    });
  });
});

describe("unread", () => {
  it("names a pinned repository no guarded path sits inside", () => {
    expect(unread(["vendor/spec/README.md"], MODULES)).toEqual([
      "vendor/lemonfiber",
      "vendor/lemonfiber/dep",
    ]);
  });

  it("says nothing where every module is read", () => {
    expect(
      unread(
        ["vendor/spec", "vendor/lemonfiber", "vendor/lemonfiber/dep"],
        MODULES,
      ),
    ).toEqual([]);
  });

  it("names every module where no path is guarded at all", () => {
    expect(unread([], MODULES)).toEqual([
      "vendor/lemonfiber",
      "vendor/lemonfiber/dep",
      "vendor/spec",
    ]);
  });

  it("does not count a module read by a path this repository owns", () => {
    expect(unread(["src/content/docs/api/kinds.md"], ["vendor/spec"])).toEqual([
      "vendor/spec",
    ]);
  });

  /**
   * The state this exists for, in the shape it was found in: the guard reads
   * four of the pinned repositories and is green, and the five it does not read
   * cannot appear in that verdict however far behind they are.
   */
  it("names the repositories a clean run is silent about", () => {
    const modules = [
      "vendor/brand",
      "vendor/homebrew-tap",
      "vendor/lemonfiber",
      "vendor/lemonfiber-web",
      "vendor/org",
      "vendor/sdk-php",
      "vendor/sdk-ts",
      "vendor/spec",
    ];
    const guarded = [
      "vendor/lemonfiber/reference/commands.md",
      "vendor/sdk-ts/src/index.ts",
      "vendor/spec",
    ];

    expect(unread(guarded, modules)).toEqual([
      "vendor/brand",
      "vendor/homebrew-tap",
      "vendor/lemonfiber-web",
      "vendor/org",
      "vendor/sdk-php",
    ]);
  });
});

describe("watched", () => {
  it("puts each path against the module holding it", () => {
    expect(
      watched(["vendor/spec/20-architecture/contracts/web-api.md"], MODULES),
    ).toEqual([
      { module: "vendor/spec", path: "20-architecture/contracts/web-api.md" },
    ]);
  });

  it("reads a module named on its own as its whole tree", () => {
    expect(watched(["vendor/spec"], MODULES)).toEqual([
      { module: "vendor/spec", path: "" },
    ]);
  });

  it("gives a file to the innermost module holding it", () => {
    expect(watched(["vendor/lemonfiber/dep/stack.toml"], MODULES)).toEqual([
      { module: "vendor/lemonfiber/dep", path: "stack.toml" },
    ]);
  });

  it("passes over a path this repository owns", () => {
    expect(
      watched(["mirrors.json", "src/content/docs/api/kinds.md"], MODULES),
    ).toEqual([]);
  });

  it("passes over a vendored path no module holds", () => {
    expect(watched(["vendor/nothing/README.md"], MODULES)).toEqual([]);
  });

  it("orders by path, so a module's sources arrive together", () => {
    expect(
      watched(
        ["vendor/spec/b.md", "vendor/lemonfiber/a.md", "vendor/spec"],
        MODULES,
      ).map((one) => `${one.module}:${one.path}`),
    ).toEqual(["vendor/lemonfiber:a.md", "vendor/spec:", "vendor/spec:b.md"]);
  });
});

describe("pinnedRevisions", () => {
  it("reads the revision and the path git printed", () => {
    const status = [
      " 2875549d2b36c9924807656b253b1b95f2f73e8a vendor/spec (heads/main)",
      "-d0a59a3c0a489a42350a4dd3a1ec827cc622b022 vendor/lemonfiber",
      "not a submodule line",
    ].join("\n");

    expect([...pinnedRevisions(status)]).toEqual([
      ["vendor/spec", "2875549d2b36c9924807656b253b1b95f2f73e8a"],
      ["vendor/lemonfiber", "d0a59a3c0a489a42350a4dd3a1ec827cc622b022"],
    ]);
  });
});

describe("declaredBranches", () => {
  it("maps a module's path to the branch it declares", () => {
    const config = [
      "submodule.spec.path vendor/spec",
      "submodule.spec.url git@example.invalid:spec.git",
      "submodule.spec.branch trunk",
      "submodule.brand.path vendor/brand",
      "nonsense",
    ].join("\n");

    expect([...declaredBranches(config)]).toEqual([
      ["vendor/spec", "trunk"],
      ["vendor/brand", "main"],
    ]);
  });
});

describe("parseCommits", () => {
  it("reads what the log format put in each field", () => {
    expect(
      parseCommits("e6a1eaa\t2026-08-25\tfix(contract): a\tb\n\n"),
    ).toEqual([
      { sha: "e6a1eaa", date: "2026-08-25", subject: "fix(contract): a\tb" },
    ]);
  });

  it("finds nothing in an empty log", () => {
    expect(parseCommits("")).toEqual([]);
  });
});

describe("report", () => {
  it("heads each module once and names every commit under its path", () => {
    const behind: Behind[] = [
      {
        module: "vendor/lemonfiber",
        pin: "d0a59a3",
        path: "reference/commands.md",
        commits: [commit("b0101f0")],
      },
      {
        module: "vendor/lemonfiber",
        pin: "d0a59a3",
        path: "reference/error-codes.md",
        commits: [commit("77a76fd")],
      },
      {
        module: "vendor/spec",
        pin: "2875549",
        path: "",
        commits: [commit("aaaaaaa")],
      },
    ];

    expect(report(behind)).toBe(
      [
        "vendor/lemonfiber is pinned at d0a59a3",
        "  reference/commands.md",
        "    b0101f0 2026-08-25 feat: b0101f0",
        "  reference/error-codes.md",
        "    77a76fd 2026-08-25 feat: 77a76fd",
        "vendor/spec is pinned at 2875549",
        "  the whole tree",
        "    aaaaaaa 2026-08-25 feat: aaaaaaa",
      ].join("\n"),
    );
  });
});

import { describe, expect, it } from "vitest";

import { ARTEFACT } from "./codes.ts";
import { INVENTORIES } from "./inventories.ts";
import {
  declaredBranches,
  GUARDED,
  parseCommits,
  pinnedRevisions,
  report,
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

  it("holds the reference the error-code guard reads, which no inventory names", () => {
    const sources = INVENTORIES.map((one) => one.source);
    expect(sources).not.toContain(ARTEFACT);
    expect(GUARDED).toContain(ARTEFACT);
  });

  it("watches the artefact that made a page wrong while its guard stayed green", () => {
    expect(watched(GUARDED, ["vendor/lemonfiber"])).toContainEqual({
      module: "vendor/lemonfiber",
      path: "reference/error-codes.md",
    });
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

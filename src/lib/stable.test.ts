import { describe, expect, it } from "vitest";

import {
  byVersion,
  describe as said,
  keptReleases,
  minorOf,
  parseStable,
  releaseOf,
  renderedIn,
  renderStable,
  settledAt,
  sourceOf,
  stableFaults,
  stableOf,
  type Expected,
  type Release,
} from "./stable.ts";

const MANIFEST = [
  'version = "0.17.0"',
  'status = "released"',
  'released_on = "2026-10-08"',
  "",
  "[pins]",
  'lemonfiber-web = "web-sha"',
  "lemonfiber-media-stack = 7",
].join("\n");

const release = (version: string, releasedOn = "2026-10-08"): Release => ({
  version,
  releasedOn,
  tag: `v${version}`,
  pins: { "lemonfiber-web": "web-sha" },
});

const commit = (sha: string): Expected => ({ kind: "commit", commit: sha });

describe("releaseOf", () => {
  it("reads a released manifest: its day, its tag and the commits it embedded", () => {
    expect(releaseOf(MANIFEST)).toEqual({
      version: "0.17.0",
      releasedOn: "2026-10-08",
      tag: "v0.17.0",
      pins: { "lemonfiber-web": "web-sha" },
    });
  });

  it("takes the tag a release was finished under", () => {
    expect(
      releaseOf(
        `${MANIFEST.split("\n[pins]")[0] ?? ""}\nreleased_as = "v0.17.1"\n`,
      )?.tag,
    ).toBe("v0.17.1");
  });

  it("reads nothing out of a manifest that is not released, or not a manifest", () => {
    expect(releaseOf(MANIFEST.replace("released", "releasable"))).toBeNull();
    expect(releaseOf('version = "0.1.0"\nstatus = "released"')).toBeNull();
    expect(releaseOf("released_on = 2026-10-08")).toBeNull();
    expect(releaseOf("= not toml")).toBeNull();
    expect(
      releaseOf(
        'version = "0.1.0"\nstatus = "released"\nreleased_on = "x"\npins = 3',
      )?.pins,
    ).toEqual({});
  });
});

describe("versions", () => {
  it("orders by number and names the minor", () => {
    expect(["0.9.0", "0.16.0", "0.10.0", "1.0"].toSorted(byVersion)).toEqual([
      "0.9.0",
      "0.10.0",
      "0.16.0",
      "1.0",
    ]);
    expect(byVersion("0.16", "0.16.0")).toBe(0);
    expect(byVersion("0.16.0", "0.16")).toBe(0);
    expect(minorOf("0.17.2")).toBe("0.17");
  });

  it("keeps every release from 0.16 on, oldest first", () => {
    expect(
      keptReleases([
        release("0.17.0"),
        release("0.15.0"),
        release("0.16.0"),
      ]).map((one) => one.version),
    ).toEqual(["0.16.0", "0.17.0"]);
  });

  it("settles a release at the end of its day", () => {
    expect(settledAt(release("0.17.0", "2026-10-08"))).toBe(
      Date.parse("2026-10-09T00:00:00Z") / 1000,
    );
  });
});

describe("sourceOf", () => {
  it("takes the core from its tag, an embedded repository from the manifest, any other from the day", () => {
    const one = release("0.17.0");
    expect(sourceOf("lemonfiber", one)).toEqual({
      kind: "tag",
      tag: "v0.17.0",
    });
    expect(sourceOf("lemonfiber-web", one)).toEqual({
      kind: "manifest",
      commit: "web-sha",
    });
    expect(sourceOf("sdk-ts", one)).toEqual({ kind: "day", day: "2026-10-08" });
  });

  it("says where each came from", () => {
    expect(said({ kind: "tag", tag: "v1" })).toBe("tag v1");
    expect(said({ kind: "manifest", commit: "x" })).toBe("the manifest's pins");
    expect(said({ kind: "day", day: "2026-10-08" })).toBe(
      "default branch on or before 2026-10-08",
    );
  });
});

describe("stableOf", () => {
  it("pins what has a commit, calls absent what had none, and names what git could not answer", () => {
    expect(
      stableOf(
        "0.16.0",
        new Map<string, Expected>([
          ["vendor/b", commit("b")],
          ["vendor/z", { kind: "absent" }],
          ["vendor/a", { kind: "absent" }],
          ["vendor/u", { kind: "unread" }],
        ]),
      ),
    ).toEqual({
      stable: {
        version: "0.16.0",
        pins: { "vendor/b": "b" },
        absent: ["vendor/a", "vendor/z"],
      },
      unread: ["vendor/u"],
    });
  });
});

describe("the stable file", () => {
  it("writes each pin with where it came from, and reads it back", () => {
    const stable = {
      version: "0.16.0",
      pins: { "vendor/sdk-ts": "ts", "vendor/lemonfiber": "core" },
      absent: ["vendor/sdk-python"],
    };
    const text = renderStable(stable, {
      "vendor/lemonfiber": { kind: "tag", tag: "v0.16.0" },
    });
    expect(text).toContain(
      '"vendor/lemonfiber" = "core"  # tag v0.16.0\n"vendor/sdk-ts" = "ts"\n',
    );
    expect(text).toContain('absent = ["vendor/sdk-python"]');
    expect(parseStable(text)).toEqual(stable);
  });

  it("writes the pins in path order, whatever order they were given in", () => {
    const text = renderStable(
      {
        version: "0.17.0",
        pins: { "vendor/b": "2", "vendor/a": "1", "vendor/c": "3" },
        absent: [],
      },
      {},
    );
    expect(text.indexOf("vendor/a")).toBeLessThan(text.indexOf("vendor/b"));
    expect(text.indexOf("vendor/b")).toBeLessThan(text.indexOf("vendor/c"));
  });

  it("writes no absent line where nothing is absent", () => {
    expect(
      renderStable({ version: "0.17.0", pins: {}, absent: [] }, {}),
    ).not.toContain("absent");
  });

  it("reads nothing out of a file with no version, and no absent list out of a malformed one", () => {
    expect(parseStable("[pins]")).toBeNull();
    expect(parseStable('version = "0.16.0"\nabsent = "x"')?.absent).toEqual([]);
    expect(
      parseStable('version = "0.16.0"\nabsent = ["a", 1]')?.absent,
    ).toEqual(["a"]);
  });
});

describe("stableFaults", () => {
  const stable = {
    version: "0.16.0",
    pins: { "vendor/a": "a", "vendor/gone": "g", "vendor/later": "l" },
    absent: ["vendor/young", "vendor/old"],
  };
  const NOW = Date.parse("2026-10-20T00:00:00Z") / 1000;
  const DAY = 24 * 3600;

  it("passes a set that is exactly what the rule gives", () => {
    expect(
      stableFaults(
        {
          version: "0.16.0",
          pins: { "vendor/a": "a" },
          absent: ["vendor/young"],
        },
        new Map<string, Expected>([
          ["vendor/a", commit("a")],
          ["vendor/young", { kind: "absent" }],
        ]),
        release("0.16.0"),
        NOW,
        DAY,
      ),
    ).toEqual([]);
  });

  it("names every pin the rule does not give, and every one it cannot read", () => {
    const faults = stableFaults(
      stable,
      new Map<string, Expected>([
        ["vendor/a", commit("other")],
        ["vendor/missing", commit("m")],
        ["vendor/unread", { kind: "unread" }],
        ["vendor/young", { kind: "absent" }],
        ["vendor/old", commit("o")],
        ["vendor/later", { kind: "absent" }],
      ]),
      null,
      NOW,
      DAY,
    );
    expect(faults).toEqual([
      { module: "vendor/a", message: "pinned at a, and 0.16.0 recorded other" },
      { module: "vendor/missing", message: "no stable pin; the rule gives m" },
      {
        module: "vendor/unread",
        message: "the rule's commit could not be read",
      },
      { module: "vendor/old", message: "called absent, and the rule gives o" },
      {
        module: "vendor/later",
        message:
          "has no commit on or before the release day, so 0.16.0 does not have it",
      },
      { module: "vendor/gone", message: "pinned, and no submodule sits there" },
    ]);
  });

  it("lets the set lag a newer release for the window after it settles, and no longer", () => {
    const newer = release("0.17.0", "2026-10-08");
    const rules = new Map<string, Expected>();
    const empty = { version: "0.16.0", pins: {}, absent: [] };
    const settled = settledAt(newer);
    expect(stableFaults(empty, rules, newer, settled + DAY, DAY)).toEqual([]);
    expect(stableFaults(empty, rules, newer, settled + DAY + 1, DAY)).toEqual([
      {
        module: null,
        message: "renders 0.16.0, and 0.17.0 was released on 2026-10-08",
      },
    ]);
    expect(stableFaults(empty, rules, release("0.16.0"), NOW, DAY)).toEqual([]);
  });
});

describe("renderedIn", () => {
  const MIRRORS = [
    { repo: "spec", path: "" },
    { repo: "sdk-ts", path: "docs/guide.md" },
    { repo: "sdk-python", path: "docs/guide.md" },
    { repo: "brand", path: ".docs" },
  ];
  const holds = (path: string): boolean =>
    path !== "vendor/sdk-ts/docs/guide.md";

  it("renders every mirror from the submodule pins", () => {
    expect(renderedIn(MIRRORS, null, () => false)).toEqual(MIRRORS);
  });

  it("drops a repository the release had no commit of, and a source the pin does not hold", () => {
    const stable = {
      version: "0.16.0",
      pins: {},
      absent: ["vendor/sdk-python"],
    };
    expect(renderedIn(MIRRORS, stable, holds)).toEqual([
      { repo: "spec", path: "" },
      { repo: "brand", path: ".docs" },
    ]);
  });
});

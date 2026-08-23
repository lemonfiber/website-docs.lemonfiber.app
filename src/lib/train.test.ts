import { describe, expect, it } from "vitest";

import {
  featureHref,
  manifestName,
  parseBoard,
  parseManifest,
  released,
  trainOf,
  type Manifest,
} from "./train.ts";

const board = {
  counts: { features: 2, requirements: 7, areas: "A–B" },
  versions: [
    {
      version: "0.1.0",
      epoch: "v1",
      status: "released",
      milestone: "M2",
      closes_epoch: null,
      goals: 3,
    },
    {
      version: "1.0.0",
      epoch: "v1",
      status: "planned",
      milestone: "M6",
      closes_epoch: "v1",
      goals: 0,
    },
  ],
  features: [
    {
      id: "A1",
      title: "Getting started",
      area: "A",
      path: "a-getting-started/A1-prerequisites.md",
      versions: [{ version: "0.1.0", status: "released" }],
    },
    {
      id: "B1",
      title: "Forms",
      area: "B",
      path: "b-running/b1-forms.md",
      versions: [],
    },
  ],
};

describe("featureHref", () => {
  it("is the file's own path, lower case, as a route", () => {
    expect(featureHref("a-getting-started/A1-prerequisites.md")).toBe(
      "/spec/10-functional/features/a-getting-started/a1-prerequisites/",
    );
  });
});

describe("manifestName", () => {
  it("names the file a version's manifest is kept in", () => {
    expect(manifestName("0.7.0")).toBe("0.7.0.toml");
  });
});

describe("parseBoard", () => {
  it("reads the counts, the versions and the features", () => {
    const parsed = parseBoard(JSON.stringify(board));
    expect(parsed.counts).toEqual({
      features: 2,
      requirements: 7,
      areas: "A–B",
    });
    expect(parsed.versions).toHaveLength(2);
    expect(parsed.versions[0]?.closesEpoch).toBeNull();
    expect(parsed.versions[1]?.closesEpoch).toBe("v1");
    expect(parsed.features[0]?.versions).toEqual(["0.1.0"]);
    expect(parsed.features[1]?.versions).toEqual([]);
  });

  it("reads an empty board out of text that is not JSON", () => {
    expect(parseBoard("not json")).toEqual({
      counts: { features: 0, requirements: 0, areas: "" },
      versions: [],
      features: [],
    });
  });

  it("reads an empty board out of JSON that is not an object", () => {
    expect(parseBoard("[1, 2]").versions).toEqual([]);
    expect(parseBoard("null").counts.features).toBe(0);
  });

  it("counts what is not a number as none, and what is not text as empty", () => {
    const parsed = parseBoard(
      JSON.stringify({ counts: { features: "many", areas: 4 } }),
    );
    expect(parsed.counts).toEqual({
      features: 0,
      requirements: 0,
      areas: "",
    });
  });

  it("drops an entry that is not the shape a board entry has", () => {
    const parsed = parseBoard(
      JSON.stringify({
        versions: ["a string", { epoch: "v1" }, board.versions[0]],
        features: [7, { title: "no id" }, board.features[0]],
      }),
    );
    expect(parsed.versions.map((one) => one.version)).toEqual(["0.1.0"]);
    expect(parsed.features.map((one) => one.id)).toEqual(["A1"]);
  });

  it("drops a version membership that names no version", () => {
    const parsed = parseBoard(
      JSON.stringify({
        features: [
          { id: "A1", versions: ["loose", { status: "released" }, {}] },
        ],
      }),
    );
    expect(parsed.features[0]?.versions).toEqual([]);
  });

  it("reads no membership out of a field that is not a list", () => {
    const parsed = parseBoard(
      JSON.stringify({ versions: "none", features: [{ id: "A1" }] }),
    );
    expect(parsed.versions).toEqual([]);
    expect(parsed.features[0]?.versions).toEqual([]);
  });
});

const manifest = `# The bootstrap release — the baseline the train governs from.
#
# 3 goals, frozen at stage-version.
version = "0.1.0"
epoch   = "v1"
delivers  = "Core: **manifest**, compose driver, CLI"
status  = "released"
repos   = ["lemonfiber"]
goals   = [
    "A1-R1",
    "A1-R2",
    "B1-R4",
]

[pins]
media-stack = "aaabfbb"
`;

describe("parseManifest", () => {
  it("reads the scalars, the goals and the pins", () => {
    const parsed = parseManifest(manifest);
    expect(parsed.version).toBe("0.1.0");
    expect(parsed.delivers).toBe("Core: manifest, compose driver, CLI");
    expect(parsed.goals).toEqual(["A1-R1", "A1-R2", "B1-R4"]);
    expect(parsed.pins).toEqual({ "media-stack": "aaabfbb" });
  });

  it("reads the day the release shipped", () => {
    const parsed = parseManifest('version = "9"\nreleased_on = "2026-08-22"');
    expect(parsed.releasedOn).toBe("2026-08-22");
  });

  it("has no day for a version that has not shipped", () => {
    expect(parseManifest('version = "9"').releasedOn).toBe("");
  });

  it("takes the first comment as the release's own sentence", () => {
    expect(parseManifest(manifest).headline).toBe(
      "The bootstrap release — the baseline the train governs from.",
    );
  });

  it("reads a goal list written on one line", () => {
    const parsed = parseManifest('goals = ["A1-R1", "A1-R2"]\nversion = "9"');
    expect(parsed.goals).toEqual(["A1-R1", "A1-R2"]);
    expect(parsed.version).toBe("9");
  });

  it("reads a list that is not the goals as neither goals nor a scalar", () => {
    const parsed = parseManifest('repos = [\n  "lemonfiber",\n]\n');
    expect(parsed.goals).toEqual([]);
  });

  it("passes over a line that states nothing it reads", () => {
    const parsed = parseManifest("\nnot a setting\nversion = 3\n");
    expect(parsed.version).toBe("");
    expect(parsed.headline).toBe("");
    expect(parsed.delivers).toBe("");
    expect(parsed.pins).toEqual({});
  });
});

const manifests = new Map<string, Manifest>([
  [
    "0.1.0",
    {
      version: "0.1.0",
      headline: "The bootstrap release.",
      delivers: "Core",
      goals: ["A1-R1"],
      releasedOn: "2026-07-26",
      pins: { "media-stack": "aaabfbb" },
    },
  ],
]);

describe("trainOf", () => {
  it("carries each version's features, and what its manifest states", () => {
    const train = trainOf(parseBoard(JSON.stringify(board)), manifests);
    expect(train).toHaveLength(2);
    expect(train[0]?.features.map((one) => one.id)).toEqual(["A1"]);
    expect(train[0]?.features[0]?.href).toBe(
      "/spec/10-functional/features/a-getting-started/a1-prerequisites/",
    );
    expect(train[0]?.headline).toBe("The bootstrap release.");
    expect(train[0]?.goals).toEqual(["A1-R1"]);
    expect(train[0]?.pins).toEqual({ "media-stack": "aaabfbb" });
  });

  it("keeps a version whose manifest the checkout does not hold", () => {
    const train = trainOf(parseBoard(JSON.stringify(board)), manifests);
    expect(train[1]?.version).toBe("1.0.0");
    expect(train[1]?.headline).toBe("");
    expect(train[1]?.delivers).toBe("");
    expect(train[1]?.goals).toEqual([]);
    expect(train[1]?.pins).toEqual({});
    expect(train[1]?.features).toEqual([]);
  });

  it("gathers every feature a version is listed against", () => {
    const two = {
      versions: [board.versions[0]],
      features: [
        board.features[0],
        {
          id: "B1",
          title: "Forms",
          area: "B",
          path: "b-running/b1-forms.md",
          versions: [{ version: "0.1.0", status: "released" }],
        },
      ],
    };
    const train = trainOf(parseBoard(JSON.stringify(two)), new Map());
    expect(train[0]?.features.map((one) => one.id)).toEqual(["A1", "B1"]);
  });
});

describe("released", () => {
  it("is the shipped versions, newest first", () => {
    const train = trainOf(parseBoard(JSON.stringify(board)), manifests);
    expect(released(train).map((one) => one.version)).toEqual(["0.1.0"]);
  });

  it("reverses the order the board holds them in", () => {
    const both = {
      versions: [
        board.versions[0],
        { ...board.versions[1], status: "released" },
      ],
    };
    const train = trainOf(parseBoard(JSON.stringify(both)), new Map());
    expect(released(train).map((one) => one.version)).toEqual([
      "1.0.0",
      "0.1.0",
    ]);
  });
});

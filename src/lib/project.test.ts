import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  manifestsIn,
  pinsIn,
  project,
  revisionOf,
  sequenceOf,
  theProject,
  type Release,
} from "./project.ts";
import { parseBoard, trainOf, type BoardFeature } from "./train.ts";

const DONE = "✅";
const PARTIAL = "◐";

const board = {
  counts: { features: 1, requirements: 4, areas: "A–B" },
  versions: [
    {
      version: "0.1.0",
      status: "released",
      milestone: "M2",
      goals: 2,
    },
    {
      version: "0.2.0",
      status: "planned",
      milestone: "M2",
      goals: 1,
    },
    {
      version: "0.3.0",
      status: "planned",
      milestone: "M9",
      goals: 0,
    },
  ],
  features: [
    {
      id: "A1",
      title: "Prerequisites",
      area: "A",
      path: "a-getting-started/a1-prerequisites.md",
      maturity: "shipped",
      shipped: "0.1.0",
      versions: [{ version: "0.1.0", status: "released" }],
    },
  ],
};

const status = `# Implementation status

## M2 — Core · ${DONE}

The baseline.

| Deliverable | Spec | Status | Landing |
|-------------|------|--------|---------|
| Parser | \`A1-R1\` | ${DONE} | #1 |
| Driver | \`A1-R2\` | ${PARTIAL} | |
`;

let root = "";

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "lf-project-"));
  const versions = join(root, "vendor", "spec", "70-operations", "versions");
  const features = join(root, "vendor", "spec", "10-functional", "features");
  mkdirSync(versions, { recursive: true });
  mkdirSync(features, { recursive: true });
  mkdirSync(join(root, "vendor", "lemonfiber"), { recursive: true });

  writeFileSync(join(features, "index.json"), JSON.stringify(board));
  writeFileSync(
    join(root, "vendor", "lemonfiber", "IMPLEMENTATION-STATUS.md"),
    status,
  );
  writeFileSync(
    join(versions, "0.1.0.toml"),
    '# The bootstrap release.\nversion = "0.1.0"\ndelivers = "Core"\ngoals = ["A1-R1", "A1-R2"]\n\n[pins]\nmedia-stack = "aaabfbb"\n',
  );
  writeFileSync(join(versions, "TEMPLATE.toml"), 'version = ""\n');
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("manifestsIn", () => {
  it("reads the manifest of every version that has one", () => {
    const found = manifestsIn(root, ["0.1.0", "0.2.0"]);
    expect([...found.keys()]).toEqual(["0.1.0"]);
    expect(found.get("0.1.0")?.goals).toEqual(["A1-R1", "A1-R2"]);
  });

  it("reads nothing where the checkout holds no manifests at all", () => {
    expect(manifestsIn(join(root, "nowhere"), ["0.1.0"]).size).toBe(0);
  });
});

describe("revisionOf", () => {
  it("reads the revision a checkout sits on", () => {
    const here = revisionOf(process.cwd());
    expect(here?.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it("reads nothing where the directory is not a checkout", () => {
    expect(revisionOf(join(root, "vendor", "spec"))).toBeNull();
  });
});

describe("pinsIn", () => {
  it("names no repository where none of them is a checkout", () => {
    expect(pinsIn(root)).toEqual([]);
  });

  it("names each repository the pages read", () => {
    const pins = pinsIn(process.cwd());
    expect(pins.map((pin) => pin.repo)).toEqual(["spec", "lemonfiber"]);
    expect(pins[0]?.date).not.toBe("");
  });
});

/** A train of one version, for the cases that need a shape rather than a file. */
const release = (version: string, milestone: string): Release => ({
  version: {
    version,
    status: "planned",
    milestone,
    headline: "",
    delivers: "",
    goals: [],
    releasedOn: "",
    pins: {},
    features: [],
  },
  built: { done: 0, total: 0, pct: 0, status: "todo" },
});

/** A catalogue entry, for the same reason. */
const feature = (id: string, maturity: string): BoardFeature => ({
  id,
  title: id,
  area: id.slice(0, 1),
  path: `${id.toLowerCase()}.md`,
  maturity,
  shipped: maturity === "shipped" ? "0.1.0" : null,
  versions: [],
});

describe("sequenceOf", () => {
  it("counts the versions the train runs to, and those that shipped", () => {
    const shipped = release("0.1.0", "M2");
    const sequence = sequenceOf(
      [
        { ...shipped, version: { ...shipped.version, status: "released" } },
        release("0.2.0", "M2"),
        release("1.0.0", "M9"),
      ],
      [],
    );
    expect(sequence.released).toBe(1);
    expect(sequence.versions).toBe(3);
  });

  it("counts the catalogue's features, and those it marks shipped", () => {
    const sequence = sequenceOf(
      [],
      [
        feature("A1", "shipped"),
        feature("A2", "building"),
        feature("A3", "planned"),
      ],
    );
    expect(sequence.shipped).toBe(1);
    expect(sequence.features).toBe(3);
  });

  it("counts nothing out of an empty train and an empty catalogue", () => {
    expect(sequenceOf([], [])).toEqual({
      released: 0,
      versions: 0,
      shipped: 0,
      features: 0,
    });
  });
});

describe("project", () => {
  it("joins the board, the manifests and the status file", () => {
    const read = project(root);
    expect(read.counts.requirements).toBe(4);
    expect(read.train.map((one) => one.version.version)).toEqual([
      "0.1.0",
      "0.2.0",
      "0.3.0",
    ]);
    expect(read.train[0]?.built).toEqual({
      done: 1,
      total: 2,
      pct: 50,
      status: "partial",
    });
    expect(read.train[0]?.version.pins).toEqual({ "media-stack": "aaabfbb" });
    expect(read.sequence).toEqual({
      released: 1,
      versions: 3,
      shipped: 1,
      features: 1,
    });
    expect(read.milestones.map((one) => one.id)).toEqual(["M2"]);
    expect(read.features.get("A1")?.done).toBe(1);
    expect(read.requirements.get("A1-R2")).toBe("partial");
    expect(read.overall).toEqual({
      done: 1,
      total: 2,
      pct: 50,
      status: "partial",
    });
    expect(read.doneMilestones).toBe(1);
    expect(read.totalMilestones).toBe(1);
  });

  it("refuses to render a checkout that holds no feature board", () => {
    expect(() => project(join(root, "nowhere"))).toThrow(
      /10-functional\/features\/index\.json is not in the checkout/,
    );
  });

  it("refuses to render a checkout that holds no implementation status", () => {
    const half = mkdtempSync(join(tmpdir(), "lf-half-"));
    const features = join(half, "vendor", "spec", "10-functional", "features");
    mkdirSync(features, { recursive: true });
    writeFileSync(join(features, "index.json"), "{}");
    expect(() => project(half)).toThrow(
      /IMPLEMENTATION-STATUS\.md is not in the checkout/,
    );
    rmSync(half, { recursive: true, force: true });
  });
});

describe("theProject", () => {
  it("reads this checkout, and reads it once", () => {
    const first = theProject();
    expect(first.counts.requirements).toBeGreaterThan(0);
    expect(theProject()).toBe(first);
  });

  it("carries a train whose released versions each proved their goals", () => {
    const shipped = theProject().train.filter(
      (one) => one.version.status === "released",
    );
    expect(shipped.length).toBeGreaterThan(0);
    for (const one of shipped) expect(one.built.pct).toBe(100);
  });
});

describe("the board this repository pins", () => {
  it("states its own scale, so no page has to count it", () => {
    const { counts } = theProject();
    expect(counts.features).toBeGreaterThan(0);
    expect(counts.requirements).toBeGreaterThan(0);
    expect(counts.areas).not.toBe("");
  });

  // `project/the-version-train` and `project/roadmap` both state in prose that
  // the train is one sequence ending at `1.0.0`. Nothing in the components can
  // say so: they render whatever the manifests declare, in the order declared.
  it("ends where both project pages say it ends", () => {
    const train = theProject().train;
    expect(train.at(-1)?.version.version).toBe("1.0.0");
  });

  it("names a version for every manifest the specification holds", () => {
    const board = parseBoard(theProjectBoard());
    expect(trainOf(board, new Map())).toHaveLength(board.versions.length);
  });
});

/** The board as this checkout holds it, for the assertion above. */
function theProjectBoard(): string {
  return JSON.stringify({
    counts: theProject().counts,
    versions: theProject().train.map((one) => ({
      version: one.version.version,
      status: one.version.status,
      milestone: one.version.milestone,
      goals: one.version.goals.length,
    })),
    features: [],
  });
}

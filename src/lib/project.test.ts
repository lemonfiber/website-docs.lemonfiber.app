import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  epochsOf,
  manifestsIn,
  pinsIn,
  project,
  revisionOf,
  theProject,
  type Release,
} from "./project.ts";
import { parseStatus, type Milestone } from "./status.ts";
import { parseBoard, trainOf } from "./train.ts";

const DONE = "✅";
const PARTIAL = "◐";

const board = {
  counts: { features: 1, requirements: 4, areas: "A–B" },
  versions: [
    {
      version: "0.1.0",
      epoch: "v1",
      status: "released",
      milestone: "M2",
      closes_epoch: null,
      goals: 2,
    },
    {
      version: "0.2.0",
      epoch: "v1",
      status: "planned",
      milestone: "M2",
      closes_epoch: null,
      goals: 1,
    },
    {
      version: "2.0.0",
      epoch: "v2",
      status: "planned",
      milestone: "M9",
      closes_epoch: null,
      goals: 0,
    },
  ],
  features: [
    {
      id: "A1",
      title: "Prerequisites",
      area: "A",
      path: "a-getting-started/a1-prerequisites.md",
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
const release = (
  version: string,
  epoch: string,
  milestone: string,
): Release => ({
  version: {
    version,
    epoch,
    status: "planned",
    milestone,
    closesEpoch: null,
    headline: "",
    delivers: "",
    goals: [],
    releasedOn: "",
    pins: {},
    features: [],
  },
  built: { done: 0, total: 0, pct: 0, status: "todo" },
});

describe("epochsOf", () => {
  const milestones: readonly Milestone[] = parseStatus(status);

  it("groups the versions by epoch, in the order the epochs appear", () => {
    const epochs = epochsOf(
      [
        release("0.1.0", "v1", "M2"),
        release("2.0.0", "v2", "M9"),
        release("0.2.0", "v1", "M2"),
      ],
      milestones,
    );
    expect(epochs.map((epoch) => epoch.id)).toEqual(["v1", "v2"]);
    expect(epochs[0]?.versions).toHaveLength(2);
  });

  it("counts a milestone two of its versions serve only once", () => {
    const [epoch] = epochsOf(
      [release("0.1.0", "v1", "M2"), release("0.2.0", "v1", "M2")],
      milestones,
    );
    expect(epoch?.milestones).toEqual(["M2"]);
    expect(epoch?.built).toEqual({
      done: 1,
      total: 2,
      pct: 50,
      status: "partial",
    });
  });

  it("counts nothing for an epoch whose milestones are not tracked", () => {
    const [epoch] = epochsOf([release("2.0.0", "v2", "M9")], milestones);
    expect(epoch?.milestones).toEqual([]);
    expect(epoch?.built.total).toBe(0);
  });

  it("counts the versions that have shipped", () => {
    const shipped = release("0.1.0", "v1", "M2");
    const [epoch] = epochsOf(
      [{ ...shipped, version: { ...shipped.version, status: "released" } }],
      milestones,
    );
    expect(epoch?.released).toBe(1);
  });

  it("reads no epoch out of an empty train", () => {
    expect(epochsOf([], milestones)).toEqual([]);
  });
});

describe("project", () => {
  it("joins the board, the manifests and the status file", () => {
    const read = project(root);
    expect(read.counts.requirements).toBe(4);
    expect(read.train.map((one) => one.version.version)).toEqual([
      "0.1.0",
      "0.2.0",
      "2.0.0",
    ]);
    expect(read.train[0]?.built).toEqual({
      done: 1,
      total: 2,
      pct: 50,
      status: "partial",
    });
    expect(read.train[0]?.version.pins).toEqual({ "media-stack": "aaabfbb" });
    expect(read.epochs.map((epoch) => epoch.id)).toEqual(["v1", "v2"]);
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
      epoch: one.version.epoch,
      status: one.version.status,
      milestone: one.version.milestone,
      closes_epoch: one.version.closesEpoch,
      goals: one.version.goals.length,
    })),
    features: [],
  });
}

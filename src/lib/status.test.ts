import { describe, expect, it } from "vitest";

import {
  blurbOf,
  declaredIn,
  featureOf,
  featureProgress,
  firstLine,
  headingOf,
  markOf,
  parseRow,
  parseStatus,
  progressOver,
  requirementProgress,
  requirementsIn,
  rollup,
  rollupStatus,
  rowToDeliverable,
  rowToGroup,
  type Progress,
} from "./status.ts";

const DONE = "✅";
const PARTIAL = "◐";
const TODO = "☐";

const file = `# Implementation status

Read this before reconstructing state from the source.

## M0 — Specification · ${DONE}

In the spec repo. Recorded here for context only.

## M2 — Core: the manifest and the driver · ${DONE}

The parts everything else is built on.

| Deliverable | Spec | Status | Landing |
|-------------|------|--------|---------|
| Manifest parser | \`A1-R1\` | ${DONE} | #18 |
| Compose driver | \`A1-R2\`, \`A1-R3\` | ${DONE} | #14 |

## M4 — Seed and backup · ${PARTIAL}

Spans two versions.

### 1 — The first slice

| Deliverable | Spec | Status | Landing |
|-------------|------|--------|---------|
| Backup | \`E3-R1..R3\` | ${DONE} | #40 |
| Restore | \`E3-R4\` | ${PARTIAL} | in flight |
| Prune | \`E3-R5\` | ${TODO} | |

## M8 — Household · ${TODO}

Not started.
`;

describe("firstLine", () => {
  it("is the text up to the first break", () => {
    expect(firstLine("one\ntwo")).toBe("one");
    expect(firstLine("only")).toBe("only");
    expect(firstLine("")).toBe("");
  });
});

describe("markOf", () => {
  it("reads the three marks the file uses", () => {
    expect(markOf(`a ${DONE} b`)).toBe("done");
    expect(markOf(`a ${PARTIAL} b`)).toBe("partial");
    expect(markOf(`a ${TODO} b`)).toBe("todo");
  });

  it("reads nothing out of a line that carries no mark", () => {
    expect(markOf("plain text")).toBeNull();
  });
});

describe("rollupStatus", () => {
  it("is done only where every part is", () => {
    expect(rollupStatus(3, 3)).toBe("done");
    expect(rollupStatus(1, 3)).toBe("partial");
    expect(rollupStatus(0, 3)).toBe("todo");
  });

  it("is not done where there is nothing to be done", () => {
    expect(rollupStatus(0, 0)).toBe("todo");
  });
});

describe("rowToDeliverable", () => {
  it("reads the title, the mark and the requirement it cites", () => {
    expect(
      rowToDeliverable(`| Manifest parser | \`A1-R1\` | ${DONE} | #18 |`),
    ).toEqual({ title: "Manifest parser", status: "done", spec: "A1-R1" });
  });

  it("keeps only the first requirement a cell lists", () => {
    const row = rowToDeliverable(
      `| Driver | \`A1-R2\`, \`A1-R3\` | ${DONE} | |`,
    );
    expect(row?.spec).toBe("A1-R2");
  });

  it("reads a row with no mark as not started", () => {
    expect(rowToDeliverable("| Prune | | | |")?.status).toBe("todo");
  });

  it("is nothing for a header, a separator or an empty first cell", () => {
    expect(rowToDeliverable("| Deliverable | Status |")).toBeNull();
    expect(rowToDeliverable("|-------------|--------|")).toBeNull();
    expect(rowToDeliverable("| | Status |")).toBeNull();
  });

  it("is nothing for a row that has no second cell", () => {
    expect(rowToDeliverable("| one |")).toBeNull();
    expect(rowToDeliverable("|")).toBeNull();
  });

  it("takes the second mark it meets as text, not as the status", () => {
    const row = rowToDeliverable(`| Both | ${DONE} | ${TODO} |`);
    expect(row?.status).toBe("done");
    expect(row?.spec).toBeUndefined();
  });
});

describe("rowToGroup", () => {
  it("is the heading's text, without the number in front of it", () => {
    expect(rowToGroup("### 1 — The first slice")).toEqual({
      title: "The first slice",
      status: "todo",
      group: true,
    });
  });

  it("is nothing where the heading has no text", () => {
    expect(rowToGroup("### ")).toBeNull();
  });
});

describe("parseRow", () => {
  it("is nothing for a line that is neither a heading nor a row", () => {
    expect(parseRow("some prose")).toBeNull();
  });
});

describe("rollup", () => {
  it("counts the rows, and leaves the grouping headings out", () => {
    expect(
      rollup([
        { title: "a", status: "done" },
        { title: "b", status: "partial" },
        { title: "group", status: "todo", group: true },
      ]),
    ).toEqual({ done: 1, total: 2, pct: 50, status: "partial" });
  });

  it("is nothing at all where there are no rows", () => {
    expect(rollup([])).toEqual({ done: 0, total: 0, pct: 0, status: "todo" });
  });
});

describe("headingOf", () => {
  it("reads the identifier and the title, without the mark", () => {
    expect(headingOf(`## M2 — Core: the driver · ${DONE}`)).toEqual({
      id: "M2",
      title: "Core: the driver",
    });
  });

  it("is nothing for a line that is not a milestone heading", () => {
    expect(headingOf("## Something else")).toBeNull();
  });
});

describe("declaredIn", () => {
  it("is the mark the heading itself carries", () => {
    expect(declaredIn(`## M4 — Seed · ${PARTIAL}`)).toBe("partial");
    expect(declaredIn("## M4 — Seed")).toBeNull();
  });
});

describe("blurbOf", () => {
  it("is the first paragraph under the heading", () => {
    expect(blurbOf("## M2 — Core\n\nThe parts\nunder it.\n\nMore.")).toBe(
      "The parts under it.",
    );
  });

  it("stops at a table, a heading or a list", () => {
    expect(blurbOf("## M2 — Core\n| a | b |")).toBe("");
    expect(blurbOf("## M2 — Core\n### Group")).toBe("");
    expect(blurbOf("## M2 — Core\n- a point")).toBe("");
  });

  it("is empty where the section is only its heading", () => {
    expect(blurbOf("## M2 — Core")).toBe("");
  });
});

describe("parseStatus", () => {
  const milestones = parseStatus(file);

  it("keeps every milestone the file records, in order", () => {
    expect(milestones.map((one) => one.id)).toEqual(["M0", "M2", "M4", "M8"]);
  });

  it("takes each milestone's status from its own heading", () => {
    expect(milestones.map((one) => one.status)).toEqual([
      "done",
      "done",
      "partial",
      "todo",
    ]);
  });

  it("counts the rows recorded under it", () => {
    expect(milestones[1]).toMatchObject({ done: 2, total: 2, pct: 100 });
    expect(milestones[2]).toMatchObject({ done: 1, total: 3, pct: 33 });
  });

  it("keeps a milestone whose work is recorded elsewhere", () => {
    expect(milestones[0]).toMatchObject({
      total: 0,
      blurb: "In the spec repo. Recorded here for context only.",
    });
  });

  it("keeps a grouping heading beside the rows it groups", () => {
    expect(milestones[2]?.deliverables[0]).toEqual({
      title: "The first slice",
      status: "todo",
      group: true,
    });
  });

  it("falls back to the rows where a heading carries no mark", () => {
    const [only] = parseStatus(
      `## M1 — Untouched\n\n| Deliverable | Status |\n|---|---|\n| One | ${DONE} |\n`,
    );
    expect(only?.status).toBe("done");
  });

  it("reads nothing out of text with no milestone heading in it", () => {
    expect(parseStatus("# Title\n\nprose only\n")).toEqual([]);
  });
});

describe("requirementsIn", () => {
  it("names every identifier a line carries", () => {
    expect(requirementsIn("`A1-R1` and `B2-R7`")).toEqual(["A1-R1", "B2-R7"]);
  });

  it("expands a range into its members", () => {
    expect(requirementsIn("`E3-R1..R3`")).toEqual(["E3-R1", "E3-R2", "E3-R3"]);
  });

  it("expands a range written with the feature repeated", () => {
    expect(requirementsIn("`C3-R1..C3-R2`")).toEqual(["C3-R1", "C3-R2"]);
  });

  it("names nothing where a line carries no identifier", () => {
    expect(requirementsIn("plain prose")).toEqual([]);
  });
});

describe("featureOf", () => {
  it("is the part of an identifier in front of its number", () => {
    expect(featureOf("C4-R12")).toBe("C4");
  });

  it("is the identifier itself where it names no requirement", () => {
    expect(featureOf("C4")).toBe("C4");
  });
});

describe("requirementProgress", () => {
  const built = requirementProgress(file);

  it("marks a requirement with what its row says", () => {
    expect(built.get("A1-R1")).toBe("done");
    expect(built.get("E3-R4")).toBe("partial");
    expect(built.get("E3-R5")).toBe("todo");
  });

  it("takes the better of two rows naming the same requirement", () => {
    const twice = requirementProgress(
      `| One | \`A1-R1\` | ${PARTIAL} |\n| Two | \`A1-R1\` | ${DONE} |\n`,
    );
    expect(twice.get("A1-R1")).toBe("done");

    const reversed = requirementProgress(
      `| One | \`A1-R1\` | ${DONE} |\n| Two | \`A1-R1\` | ${TODO} |\n`,
    );
    expect(reversed.get("A1-R1")).toBe("done");
  });

  it("reads nothing out of a line that is not a marked table row", () => {
    expect(requirementProgress("`A1-R1` in prose").size).toBe(0);
    expect(requirementProgress("| A1-R1 | no mark |").size).toBe(0);
  });
});

describe("progressOver", () => {
  const built = new Map<string, Progress>([
    ["A1-R1", "done"],
    ["A1-R2", "partial"],
  ]);

  it("counts only the requirements marked done", () => {
    expect(progressOver(["A1-R1", "A1-R2", "A1-R9"], built)).toEqual({
      done: 1,
      total: 3,
      pct: 33,
      status: "partial",
    });
  });

  it("is nothing at all where nothing is locked", () => {
    expect(progressOver([], built)).toEqual({
      done: 0,
      total: 0,
      pct: 0,
      status: "todo",
    });
  });
});

describe("featureProgress", () => {
  it("gathers each feature's requirements and counts them", () => {
    const built = featureProgress(file);
    expect(built.get("A1")).toEqual({
      id: "A1",
      done: 3,
      total: 3,
      pct: 100,
      status: "done",
    });
    expect(built.get("E3")).toEqual({
      id: "E3",
      done: 3,
      total: 5,
      pct: 60,
      status: "partial",
    });
  });
});

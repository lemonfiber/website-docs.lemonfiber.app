import { capabilities, generation, points } from "./plugins";
import { artefact } from "./schema-source";

describe("points", () => {
  it("reads a point's row, its limits and its closed fields", () => {
    const [check] = points({
      points: [
        {
          name: "doctor.check",
          summary: "A check.",
          register: "the register",
          engine: "the engine",
          requires: "doctor.contribute",
          row: {
            required: ["id", "category"],
            optional: ["timeout_s"],
            bounds: {
              timeout_s: { min: 1, max: 30, default: 10 },
              odd: "no",
              open: {},
            },
            enums: { category: ["vpn", "queue", 3] },
          },
          occupied: ["credentials."],
        },
      ],
    });
    expect(check).toEqual({
      name: "doctor.check",
      summary: "A check.",
      register: "the register",
      engine: "the engine",
      requires: "doctor.contribute",
      required: ["id", "category"],
      optional: ["timeout_s"],
      bounds: [
        { field: "timeout_s", min: "1", max: "30", default: "10" },
        { field: "open", min: "", max: "", default: "" },
      ],
      choices: [{ field: "category", values: ["vpn", "queue"] }],
      occupied: ["credentials."],
    });
  });

  it("reads a point with no row as one that asks nothing", () => {
    const [bare] = points({ points: [{ name: 7 }, "not a point"] });
    expect(bare).toMatchObject({
      name: "",
      required: [],
      bounds: [],
      choices: [],
      occupied: [],
    });
  });

  it("reads nothing out of something that is not the artefact", () => {
    expect(points(null)).toEqual([]);
    expect(points({ points: "none" })).toEqual([]);
  });
});

describe("capabilities", () => {
  it("reads a capability, who declares it and what it is held to", () => {
    expect(
      capabilities({
        capabilities: [
          {
            name: "media.serve",
            summary: "Serves the library.",
            contract: "Serves it.",
            declared_by: ["jellyfin"],
            probes: [
              {
                id: "guarded",
                title: "Refused",
                why: "So.",
                credential: "none",
              },
            ],
          },
        ],
      }),
    ).toEqual([
      {
        name: "media.serve",
        summary: "Serves the library.",
        contract: "Serves it.",
        declaredBy: ["jellyfin"],
        probes: [
          { id: "guarded", title: "Refused", why: "So.", credential: "none" },
        ],
      },
    ]);
  });

  it("reads nothing out of something that is not the vocabulary", () => {
    expect(capabilities(undefined)).toEqual([]);
  });
});

describe("generation", () => {
  it("reads the number a list states it is", () => {
    expect(generation({ vocabulary_version: 1 }, "vocabulary_version")).toBe(
      "1",
    );
    expect(generation({ vocabulary_version: "1" }, "vocabulary_version")).toBe(
      "",
    );
    expect(generation(null, "vocabulary_version")).toBe("");
  });
});

describe("the artefacts this site pins", () => {
  it("names every point, and a capability a remedy needs", () => {
    const read = points(artefact("extension-points.json"));
    expect(read.length).toBeGreaterThan(0);
    expect(read.every((one) => one.name !== "" && one.requires !== "")).toBe(
      true,
    );
  });

  it("names every capability, and who declares it", () => {
    const read = capabilities(artefact("capability-vocabulary.json"));
    expect(read.length).toBeGreaterThan(0);
    expect(read.every((one) => one.name.includes("."))).toBe(true);
  });
});

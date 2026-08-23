/**
 * What the project pages render, assembled from the checkout.
 *
 * Three pinned files stand behind both pages, and nothing is fetched: the
 * specification's generated feature board, its per-version manifests, and the
 * implementation status the binary's repository keeps. The board says what each
 * version is for, the manifests say what each one locked, and the status file
 * says how much of it exists.
 *
 * `train.ts` and `status.ts` hold the parsing. This file reads the tree through
 * `project-source.ts` and joins the two into the shapes a page asks for.
 */
import { parseRevision, type Revision } from "./mirror";
import { gitLog } from "./mirror-source";
import { readText } from "./project-source";
import {
  featureProgress,
  parseStatus,
  progressOver,
  requirementProgress,
  rollup,
  type FeatureProgress,
  type Milestone,
  type Progress,
  type Rollup,
} from "./status";
import {
  manifestName,
  parseBoard,
  parseManifest,
  trainOf,
  type Counts,
  type Manifest,
  type TrainVersion,
} from "./train";

const SPEC = "vendor/spec";
const BINARY = "vendor/lemonfiber";
const BOARD = `${SPEC}/10-functional/features/index.json`;
const MANIFESTS = `${SPEC}/70-operations/versions`;
const STATUS = `${BINARY}/IMPLEMENTATION-STATUS.md`;

/** A version of the train, with how much of what it locked exists. */
export interface Release {
  readonly version: TrainVersion;
  /** The goals it locked, against what the status file marks done. */
  readonly built: Rollup;
}

/** One major-version arc: its versions, how many shipped, and how much is built. */
export interface Epoch {
  readonly id: string;
  readonly versions: readonly Release[];
  readonly released: number;
  /** Implementation progress across the milestones the epoch's versions serve. */
  readonly built: Rollup;
  /** Those milestones, in the order the status file records them. */
  readonly milestones: readonly string[];
}

/** Everything both project pages render. */
export interface Project {
  readonly counts: Counts;
  readonly train: readonly Release[];
  readonly epochs: readonly Epoch[];
  readonly milestones: readonly Milestone[];
  readonly features: ReadonlyMap<string, FeatureProgress>;
  readonly requirements: ReadonlyMap<string, Progress>;
  readonly overall: Rollup;
  readonly doneMilestones: number;
  readonly totalMilestones: number;
  /** The revisions the pages were rendered from, where git could say. */
  readonly pinned: readonly Pin[];
}

/** One repository, at the revision this site pins it to. */
export interface Pin {
  readonly repo: string;
  readonly sha: string;
  readonly date: string;
}

/**
 * Every version manifest the checkout holds, keyed by version.
 *
 * A version the board declares but the manifests do not yet describe is simply
 * absent here; the train renders it from the board alone.
 */
export function manifestsIn(
  root: string,
  versions: readonly string[],
): Map<string, Manifest> {
  const found = new Map<string, Manifest>();
  for (const version of versions) {
    const source = readText(`${root}/${MANIFESTS}/${manifestName(version)}`);
    if (source !== null) found.set(version, parseManifest(source));
  }
  return found;
}

/** What revision a checked-out repository sits on, where it is one. */
export function revisionOf(directory: string): Revision | null {
  try {
    return parseRevision(gitLog(directory));
  } catch {
    return null;
  }
}

/** The repositories the pages read, each at the revision it is pinned to. */
export function pinsIn(root: string): Pin[] {
  const found: Pin[] = [];
  for (const repo of [SPEC, BINARY]) {
    const revision = revisionOf(`${root}/${repo}`);
    if (revision !== null)
      found.push({
        repo: repo.replace("vendor/", ""),
        sha: revision.sha,
        date: revision.date,
      });
  }
  return found;
}

/** The epochs the train runs in, in the order their versions appear. */
export function epochsOf(
  train: readonly Release[],
  milestones: readonly Milestone[],
): Epoch[] {
  // A map keeps the order its keys were first set in, which is the order the
  // epochs appear in the train.
  const byEpoch = new Map<string, Release[]>();
  for (const release of train) {
    const carried = byEpoch.get(release.version.epoch) ?? [];
    carried.push(release);
    byEpoch.set(release.version.epoch, carried);
  }

  const byId = new Map(milestones.map((one) => [one.id, one]));

  return [...byEpoch].map(([id, versions]) => {
    const served: Milestone[] = [];
    for (const { version } of versions) {
      const milestone = byId.get(version.milestone);
      if (milestone !== undefined && !served.includes(milestone))
        served.push(milestone);
    }

    return {
      id,
      versions,
      released: versions.filter(({ version }) => version.status === "released")
        .length,
      built: rollup(served.flatMap((milestone) => milestone.deliverables)),
      milestones: served.map((milestone) => milestone.id),
    };
  });
}

const missing = (path: string): Error =>
  new Error(`project: ${path} is not in the checkout`);

/**
 * The project, read from the checkout.
 *
 * A source the checkout does not hold is a fault, not an empty page. Both files
 * arrive through submodules that the rest of the site already depends on, so a
 * missing one means the checkout is incomplete — and a page that quietly says
 * nothing shipped would be worse than a build that stops.
 */
export function project(root: string): Project {
  const boardFile = readText(`${root}/${BOARD}`);
  if (boardFile === null) throw missing(BOARD);
  const statusFile = readText(`${root}/${STATUS}`);
  if (statusFile === null) throw missing(STATUS);

  const board = parseBoard(boardFile);

  const milestones = parseStatus(statusFile);
  const requirements = requirementProgress(statusFile);
  const train = trainOf(
    board,
    manifestsIn(
      root,
      board.versions.map((version) => version.version),
    ),
  ).map((version) => ({
    version,
    built: progressOver(version.goals, requirements),
  }));

  return {
    counts: board.counts,
    train,
    epochs: epochsOf(train, milestones),
    milestones,
    features: featureProgress(statusFile),
    requirements,
    overall: rollup(milestones.flatMap((one) => one.deliverables)),
    doneMilestones: milestones.filter((one) => one.status === "done").length,
    totalMilestones: milestones.length,
    pinned: pinsIn(root),
  };
}

let held: Project | null = null;

/**
 * The project, read once.
 *
 * Several components render parts of the same two pages, and each of them asks
 * for the whole of it. Reading the checkout once means they cannot be shown
 * figures taken at different moments.
 *
 * The checkout is the working directory: Astro runs its build from the project
 * root, and a module's own location is rewritten by the bundler.
 */
export function theProject(): Project {
  held ??= project(process.cwd());
  return held;
}

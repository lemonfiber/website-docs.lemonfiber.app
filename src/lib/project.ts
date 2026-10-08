/**
 * What the project pages render, assembled from the checkout.
 *
 * The pinned specification stands behind both pages, and nothing is fetched:
 * its generated feature board and its per-version manifests. The board says
 * what each version is for and how far each feature is built, and the
 * manifests say what each version locked.
 *
 * `train.ts` holds the parsing. This file reads the tree through
 * `project-source.ts` and joins the two into the shapes a page asks for.
 */
import { parseRevision, type Revision } from "@lemonfiber/website-kit/mirror";
import { gitLog } from "@lemonfiber/website-kit/mirror-source";
import { readText } from "./project-source";
import {
  manifestName,
  parseBoard,
  parseManifest,
  trainOf,
  type BoardFeature,
  type Counts,
  type Manifest,
  type TrainVersion,
} from "./train";

const SPEC = "vendor/spec";
const BOARD = `${SPEC}/10-functional/features/index.json`;
const MANIFESTS = `${SPEC}/70-operations/versions`;
/** The repositories the pages are read from. */
const READ: readonly string[] = [SPEC];

/** The train taken whole: how far along it is, and how much of it has shipped. */
export interface Sequence {
  /** How many of its versions have been released. */
  readonly released: number;
  /** How many versions it runs to. */
  readonly versions: number;
  /** How many features the catalogue marks as shipped. */
  readonly shipped: number;
  /** How many features the catalogue holds. */
  readonly features: number;
}

/** Everything both project pages render. */
export interface Project {
  readonly counts: Counts;
  readonly train: readonly TrainVersion[];
  readonly sequence: Sequence;
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
  for (const repo of READ) {
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

/**
 * Where the train stands, counted from the two files behind it.
 *
 * One serial sequence rather than a set of arcs: the manifests declare the
 * order and nothing above a version groups them. What a reader wants of the
 * whole is how much of it has shipped, which each file answers for its own
 * half — the manifests for the versions, the catalogue for the features.
 */
export function sequenceOf(
  train: readonly TrainVersion[],
  features: readonly BoardFeature[],
): Sequence {
  return {
    released: train.filter((version) => version.status === "released").length,
    versions: train.length,
    shipped: features.filter((one) => one.maturity === "shipped").length,
    features: features.length,
  };
}

const missing = (path: string): Error =>
  new Error(`project: ${path} is not in the checkout`);

/**
 * The project, read from the checkout.
 *
 * A board the checkout does not hold is a fault, not an empty page. It arrives
 * through a submodule the rest of the site already depends on, so a missing one
 * means the checkout is incomplete — and a page that quietly says nothing
 * shipped would be worse than a build that stops.
 */
export function project(root: string): Project {
  const boardFile = readText(`${root}/${BOARD}`);
  if (boardFile === null) throw missing(BOARD);

  const board = parseBoard(boardFile);
  const train = trainOf(
    board,
    manifestsIn(
      root,
      board.versions.map((version) => version.version),
    ),
  );

  return {
    counts: board.counts,
    train,
    sequence: sequenceOf(train, board.features),
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

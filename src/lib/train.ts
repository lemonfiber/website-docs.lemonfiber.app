/**
 * The release train, as the specification records it.
 *
 * Two files stand behind it, both pinned in `vendor/spec`: the generated
 * feature board (`index.json`), which holds every version and every feature,
 * and one manifest per version (`70-operations/versions/<version>.toml`), which
 * holds what that version delivers and the requirements it locked.
 *
 * Everything here is a pure function over text. Reading the checkout is
 * `project-source.ts`; joining the train to what is built is `project.ts`.
 */
import { plain } from "./markdown";
import { captured } from "./mirror";

/** The scale of the specification, counted by its own generator. */
export interface Counts {
  readonly features: number;
  readonly requirements: number;
  readonly areas: string;
}

/** One version, as the board records it. */
export interface BoardVersion {
  readonly version: string;
  readonly epoch: string;
  readonly status: string;
  readonly milestone: string;
  readonly closesEpoch: string | null;
  readonly goals: number;
}

/** One feature, as the board records it. */
export interface BoardFeature {
  readonly id: string;
  readonly title: string;
  readonly area: string;
  readonly path: string;
  readonly versions: readonly string[];
}

/** The whole board: what the specification describes, and in what order. */
export interface Board {
  readonly counts: Counts;
  readonly versions: readonly BoardVersion[];
  readonly features: readonly BoardFeature[];
}

/** What one version manifest states about itself. */
export interface Manifest {
  readonly version: string;
  /** The sentence the manifest opens with, describing the release. */
  readonly headline: string;
  /** The short phrase naming what the version delivers. */
  readonly delivers: string;
  readonly goals: readonly string[];
  /** The day the release was published, as the manifest records it. */
  readonly releasedOn: string;
  /** Submodule commits the release embedded, by repository. */
  readonly pins: Readonly<Record<string, string>>;
}

/** A feature, ready to render: its identity and where this site publishes it. */
export interface TrainFeature {
  readonly id: string;
  readonly title: string;
  readonly area: string;
  readonly href: string;
}

/** One version of the train, with everything both files know about it. */
export interface TrainVersion {
  readonly version: string;
  readonly epoch: string;
  readonly status: string;
  readonly milestone: string;
  readonly closesEpoch: string | null;
  readonly headline: string;
  readonly delivers: string;
  readonly goals: readonly string[];
  readonly releasedOn: string;
  readonly pins: Readonly<Record<string, string>>;
  readonly features: readonly TrainFeature[];
}

const FEATURES = "/spec/10-functional/features";

/** Where this site publishes one feature specification. */
export function featureHref(path: string): string {
  return `${FEATURES}/${path.replace(/\.md$/, "").toLowerCase()}/`;
}

/** A value that is a record, which is what every parsed node has to be. */
function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

const whole = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

function toCounts(value: unknown): Counts {
  const node = record(value) ?? {};
  return {
    features: whole(node["features"]),
    requirements: whole(node["requirements"]),
    areas: text(node["areas"]),
  };
}

function toVersion(value: unknown): BoardVersion | null {
  const node = record(value);
  if (node === null || text(node["version"]) === "") return null;
  const closes = node["closes_epoch"];
  return {
    version: text(node["version"]),
    epoch: text(node["epoch"]),
    status: text(node["status"]),
    milestone: text(node["milestone"]),
    closesEpoch: typeof closes === "string" ? closes : null,
    goals: whole(node["goals"]),
  };
}

/** The versions one feature is listed against, in the order the board has them. */
function memberships(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const found: string[] = [];
  for (const entry of value) {
    const node = record(entry);
    if (node !== null && text(node["version"]) !== "")
      found.push(text(node["version"]));
  }
  return found;
}

function toFeature(value: unknown): BoardFeature | null {
  const node = record(value);
  if (node === null || text(node["id"]) === "") return null;
  return {
    id: text(node["id"]),
    title: text(node["title"]),
    area: text(node["area"]),
    path: text(node["path"]),
    versions: memberships(node["versions"]),
  };
}

/** Whatever survived a shape check, with the ones that did not dropped. */
function kept<T>(value: unknown, of: (entry: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  const found: T[] = [];
  for (const entry of value) {
    const one = of(entry);
    if (one !== null) found.push(one);
  }
  return found;
}

/** Parsed JSON, or nothing where the text is not JSON at all. */
function json(source: string): unknown {
  try {
    return JSON.parse(source);
  } catch {
    return null;
  }
}

/**
 * The board, read from the JSON the specification's generator writes.
 *
 * A field that is not the shape it should be is dropped rather than trusted,
 * so a malformed board renders a short page instead of a broken one.
 */
export function parseBoard(source: string): Board {
  const node = record(json(source)) ?? {};
  return {
    counts: toCounts(node["counts"]),
    versions: kept(node["versions"], toVersion),
    features: kept(node["features"], toFeature),
  };
}

const KEY = "[a-z_][a-z0-9_-]*";
const SCALAR = new RegExp(`^(${KEY})\\s*=\\s*"([^"]*)"`);
const LIST_OPEN = new RegExp(`^(${KEY})\\s*=\\s*\\[`);
const QUOTED = /"([^"]*)"/g;
const TABLE = /^\[([a-z_]+)\]/;
const COMMENT = /^#\s?(.*)$/;

/** The strings inside one line of a manifest's array. */
function quoted(line: string): string[] {
  const found: string[] = [];
  for (const match of line.matchAll(QUOTED)) found.push(captured(match, 1));
  return found;
}

/**
 * One version manifest.
 *
 * The manifests are written by `stage-version` to a fixed shape — top-level
 * quoted scalars, one array of goals, and a `[pins]` table of quoted commits —
 * so the subset read here is the whole of what they contain. A field the file
 * does not carry comes back empty rather than absent, because a page renders
 * what it has.
 */
export function parseManifest(source: string): Manifest {
  const scalars: Record<string, string> = {};
  const goals: string[] = [];
  const pins: Record<string, string> = {};
  let headline = "";
  let table = "";
  let collecting = false;

  for (const raw of source.split("\n")) {
    const line = raw.trim();

    const comment = COMMENT.exec(line);
    if (comment !== null) {
      if (headline === "") headline = captured(comment, 1);
      continue;
    }

    if (collecting) {
      goals.push(...quoted(line));
      if (line.includes("]")) collecting = false;
      continue;
    }

    const opened = TABLE.exec(line);
    if (opened !== null) {
      table = captured(opened, 1);
      continue;
    }

    const list = LIST_OPEN.exec(line);
    if (list !== null && captured(list, 1) === "goals") {
      goals.push(...quoted(line));
      collecting = !line.includes("]");
      continue;
    }

    const scalar = SCALAR.exec(line);
    if (scalar === null) continue;
    const key = captured(scalar, 1);
    const value = captured(scalar, 2);
    if (table === "pins") pins[key] = value;
    else scalars[key] = value;
  }

  return {
    version: scalars["version"] ?? "",
    headline: plain(headline),
    delivers: plain(scalars["delivers"] ?? ""),
    goals,
    releasedOn: scalars["released_on"] ?? "",
    pins,
  };
}

/** The file name a version's manifest has. */
export function manifestName(version: string): string {
  return `${version}.toml`;
}

/**
 * The train: every version the board declares, each carrying the features it
 * ships and whatever its own manifest states.
 *
 * The board's version list is authoritative rather than inverted from feature
 * membership, so a major that owns no per-feature goal is still a version.
 */
export function trainOf(
  board: Board,
  manifests: ReadonlyMap<string, Manifest>,
): TrainVersion[] {
  const byVersion = new Map<string, TrainFeature[]>();
  for (const feature of board.features)
    for (const version of feature.versions) {
      const carried = byVersion.get(version) ?? [];
      carried.push({
        id: feature.id,
        title: feature.title,
        area: feature.area,
        href: featureHref(feature.path),
      });
      byVersion.set(version, carried);
    }

  return board.versions.map((version) => {
    const manifest = manifests.get(version.version);
    return {
      ...version,
      headline: manifest?.headline ?? "",
      delivers: manifest?.delivers ?? "",
      goals: manifest?.goals ?? [],
      releasedOn: manifest?.releasedOn ?? "",
      pins: manifest?.pins ?? {},
      features: byVersion.get(version.version) ?? [],
    };
  });
}

/** The versions that have shipped, newest first. */
export function released(train: readonly TrainVersion[]): TrainVersion[] {
  return train.filter((version) => version.status === "released").reverse();
}

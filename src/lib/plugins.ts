/**
 * The two published lists a plugin author writes against.
 *
 * `extension-points.json` names the places a plugin may add a row, and
 * `capability-vocabulary.json` names what a service can be relied on to do.
 * Both are generated from the binary's own declarations, so the plugin pages
 * render them at the pinned revision rather than restating either.
 *
 * Pure functions over parsed JSON. Reading the file is `schema-source.ts`.
 */

type Node = Readonly<Record<string, unknown>>;

const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (node: Node, key: string): string => {
  const value = node[key];
  return typeof value === "string" ? value : "";
};

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((one): one is string => typeof one === "string")
    : [];

const nodes = (value: unknown): Node[] =>
  Array.isArray(value) ? value.filter(isNode) : [];

const at = (node: unknown, key: string): Node =>
  isNode(node) && isNode(node[key]) ? node[key] : {};

/** A limit on one field of a row: its least, most and default. */
export interface Bound {
  readonly field: string;
  readonly min: string;
  readonly max: string;
  readonly default: string;
}

/** The values one field of a row is closed to. */
export interface Choice {
  readonly field: string;
  readonly values: readonly string[];
}

/** One place a plugin may add a row. */
export interface Point {
  readonly name: string;
  readonly summary: string;
  readonly register: string;
  readonly engine: string;
  readonly requires: string;
  readonly required: readonly string[];
  readonly optional: readonly string[];
  readonly bounds: readonly Bound[];
  readonly choices: readonly Choice[];
  /** Ids the bundled rows hold. One ending in `.` holds every id under it. */
  readonly occupied: readonly string[];
}

const numeral = (node: Node, key: string): string => {
  const value = node[key];
  return typeof value === "number" ? String(value) : "";
};

/** Every extension point, in the order the artefact publishes them. */
export function points(artefact: unknown): Point[] {
  const published = isNode(artefact) ? nodes(artefact["points"]) : [];
  return published.map((point) => {
    const row = at(point, "row");
    return {
      name: text(point, "name"),
      summary: text(point, "summary"),
      register: text(point, "register"),
      engine: text(point, "engine"),
      requires: text(point, "requires"),
      required: strings(row["required"]),
      optional: strings(row["optional"]),
      bounds: Object.entries(at(row, "bounds"))
        .filter((entry): entry is [string, Node] => isNode(entry[1]))
        .map(([field, bound]) => ({
          field,
          min: numeral(bound, "min"),
          max: numeral(bound, "max"),
          default: numeral(bound, "default"),
        })),
      choices: Object.entries(at(row, "enums")).map(([field, values]) => ({
        field,
        values: strings(values),
      })),
      occupied: strings(point["occupied"]),
    };
  });
}

/** One probe a claim of a capability is held to. */
export interface Probe {
  readonly id: string;
  readonly title: string;
  readonly why: string;
  /** `none`, or `operator` where the probe presents the operator's credential. */
  readonly credential: string;
}

/** One capability in the vocabulary. */
export interface Capability {
  readonly name: string;
  readonly summary: string;
  readonly contract: string;
  readonly declaredBy: readonly string[];
  readonly probes: readonly Probe[];
}

/** Every capability, in the order the vocabulary publishes them. */
export function capabilities(vocabulary: unknown): Capability[] {
  const listed = isNode(vocabulary) ? nodes(vocabulary["capabilities"]) : [];
  return listed.map((one) => ({
    name: text(one, "name"),
    summary: text(one, "summary"),
    contract: text(one, "contract"),
    declaredBy: strings(one["declared_by"]),
    probes: nodes(one["probes"]).map((probe) => ({
      id: text(probe, "id"),
      title: text(probe, "title"),
      why: text(probe, "why"),
      credential: text(probe, "credential"),
    })),
  }));
}

/** The generation a published list states it is, or empty where it says none. */
export function generation(artefact: unknown, key: string): string {
  if (!isNode(artefact)) return "";
  const value = artefact[key];
  return typeof value === "number" ? String(value) : "";
}

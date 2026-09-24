/**
 * A JSON Schema, read as a reference a person can follow.
 *
 * The contract artefacts are generated from the Rust types that serialise a
 * reply or read a manifest, and they carry those types' documentation as
 * `description`. This turns a schema's definitions into rows — a field, its
 * type, whether it is required, what it means — so a reference page renders the
 * artefact at the pinned revision rather than a transcription of it.
 *
 * A type comes back as tokens rather than as a sentence. The words joining
 * them ("array of", "or") are the chrome's, and come from `messages/`.
 *
 * Pure functions over parsed JSON. Reading the file is `schema-source.ts`.
 */

/** One piece of a type as it is written out. */
export type Token =
  | { readonly kind: "ref"; readonly name: string }
  | { readonly kind: "primitive"; readonly name: string }
  | { readonly kind: "const"; readonly value: string }
  | { readonly kind: "bound"; readonly text: string }
  | { readonly kind: "word"; readonly word: Word };

/** The joining words a type is written out with. */
export type Word = "arrayOf" | "mapOf" | "or" | "any";

/** One field of an object. */
export interface Field {
  readonly name: string;
  readonly required: boolean;
  readonly description: string;
  readonly type: readonly Token[];
}

/** One branch of a `oneOf`: a bare value, or an object told apart by a tag. */
export interface Variant {
  /** The field whose constant names the branch; empty for a bare value. */
  readonly tag: string;
  /** The constant naming it; empty where the branch names itself no way. */
  readonly value: string;
  readonly description: string;
  readonly fields: readonly Field[];
  /** What the branch is, where it is neither a constant nor an object. */
  readonly type: readonly Token[];
}

/** One named definition. */
export interface Definition {
  readonly name: string;
  readonly description: string;
  readonly fields: readonly Field[];
  readonly variants: readonly Variant[];
  /** What it is, where it is neither an object nor a choice. */
  readonly type: readonly Token[];
}

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

const nodes = (value: readonly unknown[]): Node[] => value.filter(isNode);

const REF = /^#\/\$defs\/(.+)$/;

const word = (one: Word): Token => ({ kind: "word", word: one });

/** Several types, joined by "or". */
const either = (branches: readonly (readonly Token[])[]): Token[] =>
  branches.flatMap((branch, at) =>
    at === 0 ? [...branch] : [word("or"), ...branch],
  );

/** The limits a number or a string is declared with, as the schema states them. */
const bounds = (node: Node): Token[] => {
  const said: string[] = [];
  const format = text(node, "format");
  if (format !== "") said.push(format);
  for (const [key, sign] of [
    ["minimum", "≥"],
    ["maximum", "≤"],
  ] as const) {
    const value = node[key];
    if (typeof value === "number") said.push(`${sign} ${String(value)}`);
  }
  return said.length === 0 ? [] : [{ kind: "bound", text: said.join(", ") }];
};

/** One `type` name, with what it says about its members. */
const primitive = (node: Node, name: string): Token[] => {
  if (name === "array")
    return [
      word("arrayOf"),
      ...typeOf(isNode(node["items"]) ? node["items"] : {}),
    ];
  if (name === "object" && isNode(node["additionalProperties"]))
    return [word("mapOf"), ...typeOf(node["additionalProperties"])];
  return [{ kind: "primitive", name }];
};

/** What a schema node accepts, written out as tokens. */
export function typeOf(node: Node): Token[] {
  const ref = REF.exec(text(node, "$ref"));
  if (ref?.[1] !== undefined) return [{ kind: "ref", name: ref[1] }];

  const constant = node["const"];
  if (typeof constant === "string" || typeof constant === "number")
    return [{ kind: "const", value: JSON.stringify(constant) }];

  const listed = node["enum"];
  if (Array.isArray(listed))
    return either(
      listed.map((value) => [
        { kind: "const", value: JSON.stringify(value) } as const,
      ]),
    );

  for (const key of ["anyOf", "oneOf"]) {
    const branches = node[key];
    if (Array.isArray(branches)) return either(nodes(branches).map(typeOf));
  }

  const declared = node["type"];
  const names = typeof declared === "string" ? [declared] : strings(declared);
  if (names.length === 0) return [word("any")];
  return [
    ...either(names.map((name) => primitive(node, name))),
    ...bounds(node),
  ];
}

/** Every property of an object node, in the order the schema lists them. */
export function fieldsOf(node: Node): Field[] {
  const properties = isNode(node["properties"]) ? node["properties"] : {};
  const required = new Set(strings(node["required"]));
  return Object.entries(properties)
    .filter((entry): entry is [string, Node] => isNode(entry[1]))
    .map(([name, property]) => ({
      name,
      required: required.has(name),
      description: text(property, "description"),
      type: typeOf(property),
    }));
}

/** The property whose constant tells a tagged branch from its siblings. */
const tagOf = (properties: Node): [string, string] => {
  for (const [name, property] of Object.entries(properties))
    if (isNode(property) && typeof property["const"] === "string")
      return [name, property["const"]];
  return ["", ""];
};

/** One branch of a `oneOf`. */
export function variantOf(branch: Node): Variant {
  const description = text(branch, "description");
  const constant = branch["const"];
  if (typeof constant === "string")
    return { tag: "", value: constant, description, fields: [], type: [] };
  const properties = branch["properties"];
  if (isNode(properties)) {
    const [tag, value] = tagOf(properties);
    return {
      tag,
      value,
      description,
      fields: fieldsOf(branch).filter((field) => field.name !== tag),
      type: [],
    };
  }
  return { tag: "", value: "", description, fields: [], type: typeOf(branch) };
}

/** One named definition, whatever shape it takes. */
export function definitionOf(name: string, node: Node): Definition {
  const description = text(node, "description");
  const branches = node["oneOf"];
  if (Array.isArray(branches))
    return {
      name,
      description,
      fields: [],
      variants: nodes(branches).map(variantOf),
      type: [],
    };
  if (isNode(node["properties"]))
    return {
      name,
      description,
      fields: fieldsOf(node),
      variants: [],
      type: [],
    };
  return { name, description, fields: [], variants: [], type: typeOf(node) };
}

/** Every definition under a node's `$defs`, by name. */
export function definitionsIn(node: Node): Definition[] {
  const defs = isNode(node["$defs"]) ? node["$defs"] : {};
  return Object.entries(defs)
    .filter((entry): entry is [string, Node] => isNode(entry[1]))
    .map(([name, one]) => definitionOf(name, one));
}

/** A payload kind, and the definition its `data` is. */
export interface Kind {
  readonly name: string;
  readonly data: readonly Token[];
}

/** What the web-API contract describes: every kind, and every type they use. */
export interface Payloads {
  readonly kinds: readonly Kind[];
  readonly definitions: readonly Definition[];
  /** Names defined twice with different content. Empty in a sound artefact. */
  readonly disagreeing: readonly string[];
}

const byName = <T extends { readonly name: string }>(a: T, b: T): number =>
  a.name.localeCompare(b.name);

/** What the kinds read so far have defined, by name, as it was printed. */
interface Merged {
  readonly printed: Map<string, string>;
  readonly definitions: Definition[];
  readonly disagreeing: Set<string>;
}

/** One kind's `$defs`, folded into what the kinds before it defined. */
const merge = (defs: Node, into: Merged): void => {
  for (const [defined, node] of Object.entries(defs)) {
    if (!isNode(node)) continue;
    const printed = JSON.stringify(node);
    const before = into.printed.get(defined);
    if (before === undefined) {
      into.printed.set(defined, printed);
      into.definitions.push(definitionOf(defined, node));
    } else if (before !== printed) into.disagreeing.add(defined);
  }
};

/** A kind's name and what its `data` is. */
const kindOf = (name: string, schema: Node): Kind => {
  const properties = isNode(schema["properties"]) ? schema["properties"] : {};
  const data = isNode(properties["data"]) ? properties["data"] : {};
  return { name, data: typeOf(data) };
};

/**
 * The web-API contract, read as one reference.
 *
 * Each kind is a complete schema carrying its own `$defs`, so a type every kind
 * uses is written out in each. They are merged by name; a name defined two
 * different ways is reported rather than resolved, because picking one would
 * publish a shape the other kind does not send.
 */
export function payloads(contract: unknown): Payloads {
  const kinds =
    isNode(contract) && isNode(contract["kinds"]) ? contract["kinds"] : {};
  const merged: Merged = {
    printed: new Map(),
    definitions: [],
    disagreeing: new Set(),
  };
  const described: Kind[] = [];

  for (const [name, schema] of Object.entries(kinds)) {
    if (!isNode(schema)) continue;
    described.push(kindOf(name, schema));
    merge(isNode(schema["$defs"]) ? schema["$defs"] : {}, merged);
  }

  described.sort(byName);
  merged.definitions.sort(byName);
  const disagreeing = [...merged.disagreeing];
  disagreeing.sort((a, b) => a.localeCompare(b));
  return { kinds: described, definitions: merged.definitions, disagreeing };
}

/**
 * A standalone schema — the plugin manifest's — read as one reference.
 *
 * Its root is a definition like any other, named by its `title`, and listed
 * first because it is where a reader starts.
 */
export function standalone(schema: unknown): Definition[] {
  if (!isNode(schema)) return [];
  const root = definitionOf(text(schema, "title"), schema);
  const rest = definitionsIn(schema);
  rest.sort(byName);
  return [root, ...rest];
}

/** Parsed JSON, or nothing where the text is not JSON. */
export function parsedJson(json: string | null): unknown {
  if (json === null) return null;
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

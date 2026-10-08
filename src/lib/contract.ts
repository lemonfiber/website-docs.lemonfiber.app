/**
 * The web API's contract, read out of the directory the core writes it as.
 *
 * The core keeps the contract as `contract/web-api/`: an index naming one file
 * per payload kind, one file per shared definition under `defs/`, and the
 * reads, the refusals and the key-callable actions beside them. A definition is
 * reached by a relative `$ref` to its file. This site's readers take one
 * document whose every kind carries the definitions it reaches under its own
 * `$defs`, so this puts the directory back together in that shape: each file
 * reference becomes `#/$defs/<name>`, and each kind gains every definition it
 * reaches, however deep.
 *
 * Pure: `read` hands over one file of the directory, by its path inside it, or
 * null where the directory holds no such file.
 */

import { parsedJson } from "./schema.ts";

/** The directory, inside the pinned core. */
export const CONTRACT_DIRECTORY = "vendor/lemonfiber/contract/web-api";

type Read = (file: string) => string | null;

/** A JSON value as a record, or null where it is not one. */
const record = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** The definition a file reference names: `../defs/Code.json` names `Code`. */
const named = (reference: string): string | null => {
  if (reference.startsWith("#") || !reference.endsWith(".json")) return null;
  const file = reference.slice(reference.lastIndexOf("/") + 1);
  return file.slice(0, -".json".length);
};

/**
 * `value` with every file reference pointed at `#/$defs`, and the name of each
 * definition it reached added to `reached`.
 */
function pointed(value: unknown, reached: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((one) => pointed(one, reached));
  const object = record(value);
  if (object === null) return value;
  return Object.fromEntries(
    Object.entries(object).map(([key, inner]) => {
      if (key !== "$ref" || typeof inner !== "string")
        return [key, pointed(inner, reached)];
      const name = named(inner);
      if (name === null) return [key, inner];
      reached.add(name);
      return [key, `#/$defs/${name}`];
    }),
  );
}

/** One kind, with every definition it reaches under its `$defs`. */
function kind(read: Read, file: string): unknown {
  const reached = new Set<string>();
  const schema = record(pointed(parsedJson(read(file)), reached));
  if (schema === null) return null;

  const defs: Record<string, unknown> = {};
  const pending = [...reached];
  for (let name = pending.pop(); name !== undefined; name = pending.pop()) {
    if (name in defs) continue;
    const found = new Set<string>();
    const definition = record(
      pointed(parsedJson(read(`defs/${name}.json`)), found),
    );
    if (definition === null) continue;
    defs[name] = Object.fromEntries(
      Object.entries(definition).filter(([key]) => key !== "$schema"),
    );
    pending.push(...found);
  }

  // By code point, which is the order the core writes a kind's definitions in.
  const sorted = Object.fromEntries(
    Object.entries(defs).sort(([a], [b]) => (a < b ? -1 : 1)),
  );
  return Object.keys(sorted).length === 0
    ? schema
    : { ...schema, $defs: sorted };
}

/**
 * The whole contract as one document, or null where the directory has no
 * readable index. A file the index names and the directory lacks reads as null
 * in its place, which is what each reader already refuses.
 */
export function assembledContract(read: Read): unknown {
  const index = record(parsedJson(read("index.json")));
  if (index === null) return null;

  const side = (key: string): unknown => {
    const file = index[key];
    return typeof file === "string" ? parsedJson(read(file)) : null;
  };
  const kinds = record(index["kinds"]) ?? {};

  return {
    api_version: index["api_version"],
    key_callable: side("key_callable"),
    kinds: Object.fromEntries(
      Object.entries(kinds).map(([name, file]) => [
        name,
        typeof file === "string" ? kind(read, file) : null,
      ]),
    ),
    reads: side("reads"),
    refusals: side("refusals"),
  };
}

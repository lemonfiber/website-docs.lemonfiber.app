/**
 * One payload kind's shape: the type its `data` is, and every type that one is
 * built from, out of the contract read as one reference.
 *
 * Pure functions over what `schema.ts` reads.
 */
import type { Definition, Field, Payloads, Token } from "./schema.ts";

/** The definitions a run of tokens names. */
const named = (tokens: readonly Token[]): string[] =>
  tokens.flatMap((token) => (token.kind === "ref" ? [token.name] : []));

const inFields = (fields: readonly Field[]): string[] =>
  fields.flatMap((field) => named(field.type));

/** Every definition one definition names directly. */
const namedBy = (definition: Definition): string[] => [
  ...named(definition.type),
  ...inFields(definition.fields),
  ...definition.variants.flatMap((variant) => [
    ...named(variant.type),
    ...inFields(variant.fields),
  ]),
];

/**
 * The definition `kind`'s `data` is, then each it reaches, nearest first and
 * each once; empty where the contract has no such kind, or its `data` names no
 * definition.
 */
export function kindDefinitions(read: Payloads, kind: string): Definition[] {
  const byName = new Map(read.definitions.map((one) => [one.name, one]));
  const queue = named(read.kinds.find((one) => one.name === kind)?.data ?? []);
  const reached: Definition[] = [];
  const seen = new Set<string>();
  for (const name of queue) {
    const definition = byName.get(name);
    if (seen.has(name) || definition === undefined) continue;
    seen.add(name);
    reached.push(definition);
    queue.push(...namedBy(definition));
  }
  return reached;
}

/** One kind, and the first paragraph of what its `data` type says it is. */
export interface KindSummary {
  readonly name: string;
  readonly summary: string;
}

/**
 * Every kind, in the contract's order, each with the first paragraph of its
 * `data` type's description; empty for a kind whose `data` is no definition.
 */
export function kindSummaries(read: Payloads): KindSummary[] {
  return read.kinds.map((kind) => {
    const [first] = kindDefinitions(read, kind.name);
    return {
      name: kind.name,
      summary: (first?.description ?? "").split("\n\n", 1).join(""),
    };
  });
}

/**
 * The wrapper every payload arrives in, read out of the contract.
 *
 * Each kind's schema carries the envelope at its root, so the envelope is what
 * every kind's root says alike. A field whose type differs from kind to kind —
 * `data`, which is the payload — keeps its name and meaning and has no type.
 *
 * Pure functions over the parsed contract.
 */
import { fieldsOf, type Field, type Token } from "./schema.ts";

/** One envelope field, with no type where the kinds give it different ones. */
export interface EnvelopeField {
  readonly name: string;
  readonly required: boolean;
  readonly description: string;
  readonly type: readonly Token[] | null;
}

type Node = Readonly<Record<string, unknown>>;

const isNode = (value: unknown): value is Node =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A field as every kind must say it alike: its name, whether it is required, what it is. */
const said = (field: Field): string =>
  JSON.stringify([field.name, field.required, field.description]);

/**
 * The fields every kind's root declares alike, in the first kind's order; empty
 * where the contract holds no kind.
 */
export function envelopeOf(contract: unknown): EnvelopeField[] {
  const kinds =
    isNode(contract) && isNode(contract["kinds"])
      ? Object.values(contract["kinds"]).filter(isNode)
      : [];
  const each = kinds.map(fieldsOf);
  const [first = [], ...rest] = each;
  return first
    .filter((field) =>
      rest.every((fields) => fields.some((one) => said(one) === said(field))),
    )
    .map((field) => {
      const type = JSON.stringify(field.type);
      const alike = rest.every((fields) =>
        fields.some(
          (one) => one.name === field.name && JSON.stringify(one.type) === type,
        ),
      );
      return {
        name: field.name,
        required: field.required,
        description: field.description,
        type: alike ? field.type : null,
      };
    });
}

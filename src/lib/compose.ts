/**
 * One service's block out of a Compose file, as the file has it.
 *
 * `advanced/adding-a-service` shows a real service entry rather than a copy of
 * one, so the image, its digest and the networks it joins are the ones the
 * pinned stack runs.
 *
 * Pure functions over text.
 */

/** A key at the indentation Compose gives a service under `services:`. */
const SERVICE = /^ {2}[A-Za-z0-9_.-]+:\s*$/;

/** A line at the top level of the file. */
const TOP = /^\S/;

/**
 * The block naming `name` under `services:`, from its key to the line before
 * the next service or top-level key, with `services:` above it; null where the
 * file holds no such service.
 */
export function serviceBlock(yaml: string, name: string): string | null {
  const lines = yaml.split("\n");
  const start = lines.findIndex((line) => line.trimEnd() === `  ${name}:`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => SERVICE.test(line) || TOP.test(line));
  const body = end === -1 ? rest : rest.slice(0, end);
  const kept = body.slice(
    0,
    body.findLastIndex((line) => line.trim() !== "") + 1,
  );
  return ["services:", ...lines.slice(start, start + 1), ...kept].join("\n");
}

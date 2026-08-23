/** The structural rules, as pure functions over a described tree. */

export interface Violation {
  readonly where: string;
  readonly line: number | null;
  readonly message: string;
}

export interface SourceFile {
  /** Path relative to the repository root. */
  readonly path: string;
  readonly text: string;
}

/** A tree under `src/content/docs` that another repository owns. */
export interface Mirror {
  /** Route below `src/content/docs`, e.g. `develop/architecture`. */
  readonly route: string;
  readonly repo: string;
  readonly path: string;
}

/** What the filesystem actually holds at a declared mirror's route. */
export interface MirrorState {
  readonly route: string;
  readonly isSymlink: boolean;
  readonly exists: boolean;
  /** Realpath relative to the repository root, or null when unresolvable. */
  readonly resolvesTo: string | null;
}

export const LINE_CAP = 550;

/** The lint escape hatch, spelled so this file does not trip its own rule. */
const SUPPRESSION = ["eslint", "disable"].join("-");
const TS_ESCAPE = /@ts-(?:ignore|expect-error|nocheck)/;
const EXTERNAL = /https?:\/\/(?!127\.0\.0\.1|localhost)/;
const COMMENT = /^\s*(?:\/\/|\*|<!--)/;

/** Markers that open an argument rather than state a fact. */
const REASONING =
  /^\s*(?:\/\/|\*|#|<!--)\s*(?:because|we |i |the reason|this is why|originally|it turns out|note that|arguably)/i;

const at = (path: string, line: number | null, message: string): Violation => ({
  where: path,
  line,
  message,
});

/** The prose a reader sees in a chrome template, one chunk per text run. */
export function chromeProse(source: string): string[] {
  const template = source.replace(/^---[\s\S]*?\n---/, "");
  const stripped = template
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(style|script)[\s\S]*?<\/\1>/g, "")
    .replace(/\{[^{}]*\}/g, "")
    .replace(/<[^>]*>/g, "\n");

  const found: string[] = [];
  for (const chunk of stripped.split("\n")) {
    const words = chunk
      .trim()
      .split(/\s+/)
      .filter((w) => /[A-Za-z]{2,}/.test(w));
    if (words.length >= 2) found.push(words.join(" "));
  }
  return found;
}

/** The line-by-line and whole-file rules for one authored file. */
export function fileViolations(file: SourceFile): Violation[] {
  const found: Violation[] = [];
  const lines = file.text.split("\n");

  lines.forEach((line, i) => {
    const n = i + 1;
    if (EXTERNAL.test(line) && !COMMENT.test(line))
      found.push(at(file.path, n, "external origin"));
    if (line.includes(SUPPRESSION))
      found.push(at(file.path, n, "lint suppression"));
    if (TS_ESCAPE.test(line))
      found.push(at(file.path, n, "TypeScript escape hatch"));
    if (REASONING.test(line))
      found.push(
        at(
          file.path,
          n,
          "reasoning in a comment — state the fact, argue in the ADR",
        ),
      );
  });

  if (!file.path.endsWith(".test.ts") && lines.length > LINE_CAP)
    found.push(
      at(
        file.path,
        null,
        `${String(lines.length)} lines, cap is ${String(LINE_CAP)}`,
      ),
    );

  if (file.path.endsWith(".astro"))
    for (const prose of chromeProse(file.text))
      found.push(
        at(
          file.path,
          null,
          `prose in the chrome ("${prose.slice(0, 44)}…") — move it to messages/`,
        ),
      );

  return found;
}

/**
 * A mirror renders content another repository owns. Its route must be a
 * symlink into `vendor/`; a real directory there is a second copy of a fact
 * that already has a home.
 */
export function mirrorViolations(
  declared: readonly Mirror[],
  state: readonly MirrorState[],
): Violation[] {
  const found: Violation[] = [];
  const byRoute = new Map(state.map((s) => [s.route, s]));

  for (const mirror of declared) {
    const where = `src/content/docs/${mirror.route}`;
    const actual = byRoute.get(mirror.route);

    if (!actual?.exists) {
      found.push(at(where, null, "declared mirror is missing"));
      continue;
    }
    if (!actual.isSymlink) {
      found.push(
        at(
          where,
          null,
          "a mirror must be a symlink, not a copy — it belongs upstream",
        ),
      );
      continue;
    }
    const expected = `vendor/${mirror.repo}/${mirror.path}`;
    if (actual.resolvesTo === null) {
      found.push(at(where, null, "mirror symlink does not resolve"));
      continue;
    }
    if (actual.resolvesTo !== expected)
      found.push(
        at(
          where,
          null,
          `mirror resolves to ${actual.resolvesTo}, expected ${expected}`,
        ),
      );
  }

  const known = new Set(declared.map((m) => m.route));
  for (const actual of state)
    if (!known.has(actual.route))
      found.push(
        at(
          `src/content/docs/${actual.route}`,
          null,
          "undeclared mirror — add it to mirrors.json",
        ),
      );

  return found;
}

/** The route a content file serves, relative to `src/content/docs`. */
export function routeOf(relativePath: string): string {
  return relativePath.replace(/\.(md|mdx)$/, "").replace(/(^|\/)index$/, "");
}

/** A page this repository owns must not claim a route a mirror already serves. */
export function collisionViolations(
  ownedRoutes: readonly string[],
  declared: readonly Mirror[],
): Violation[] {
  const found: Violation[] = [];
  for (const route of ownedRoutes)
    for (const mirror of declared)
      if (route === mirror.route || route.startsWith(`${mirror.route}/`))
        found.push(
          at(
            `src/content/docs/${route}`,
            null,
            `slug collides with the ${mirror.repo} mirror — one home per fact`,
          ),
        );
  return found;
}

export function format(found: readonly Violation[]): string {
  return found
    .map(
      (v) =>
        `  ${v.where}${v.line === null ? "" : `:${String(v.line)}`}  ${v.message}`,
    )
    .join("\n");
}

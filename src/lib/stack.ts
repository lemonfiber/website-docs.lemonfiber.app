/**
 * The profiles and forms the stack manifest declares, as the pages set them out.
 *
 * `running/forms-and-slices` and `running/the-services` render their tables from
 * these rather than writing them down, so a service added, moved or reworded is
 * on the page in the build that pins it.
 *
 * Pure functions over the manifest's text.
 */
import { parse } from "smol-toml";

/** One profile, and the services that carry it. */
export interface Profile {
  readonly id: string;
  readonly description: string;
  /** The services' display names, in the order the manifest declares them. */
  readonly services: readonly string[];
}

/** One form, and the profiles it is made of. */
export interface Form {
  readonly id: string;
  readonly description: string;
  readonly profiles: readonly string[];
}

/** One service, as `running/the-services` sets it out. */
export interface Service {
  readonly name: string;
  readonly describes: string;
  readonly withoutIt: string;
  /** The port it publishes, or null for one that publishes none. */
  readonly port: number | null;
  /** `loopback` or `lan`, or null for one that publishes no port. */
  readonly bind: string | null;
  readonly criticality: string;
  /** The form with the fewest services that starts it, or null where none does. */
  readonly smallestForm: string | null;
}

/** The media stack's checkout, and its manifest's root within it. */
export const STACK_CHECKOUT = "vendor/lemonfiber-media-stack";
export const STACK_ROOT = "stack.toml";

type Table = Record<string, unknown>;

/**
 * The files a manifest's root names in its `include` list, in order: none for a
 * root that keeps its services in itself, as stacks before ARCH-R171 do.
 */
export function includedIn(root: string): string[] {
  let read: Table;
  try {
    read = parse(root);
  } catch {
    return [];
  }
  const listed = read["include"];
  return Array.isArray(listed)
    ? listed.filter((entry): entry is string => typeof entry === "string")
    : [];
}

/**
 * The manifest as one document: the root first, then each file its `include`
 * list names, in that order, the way the core and the media stack join it. A
 * root with no `include` is the whole manifest already. `read` answers an
 * entry, relative to the stack's root, with its text, or null; an entry it
 * cannot answer is left out, and a root that is not there is an empty manifest.
 */
export function joinedStack(
  root: string | null,
  read: (entry: string) => string | null,
): string {
  if (root === null) return "";
  const parts = [root];
  for (const entry of includedIn(root)) {
    const text = read(entry);
    if (text !== null) parts.push(`\n# ${entry}\n${text}`);
  }
  return parts.join("");
}

/** The `[[name]]` entries of the manifest, or none where it does not parse. */
const entries = (stack: string, name: string): Table[] => {
  let read: Table;
  try {
    read = parse(stack);
  } catch {
    return [];
  }
  const found = read[name];
  return Array.isArray(found) ? (found as Table[]) : [];
};

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

/** Every profile, each with the services whose `profile` names it. */
export function profilesOf(stack: string): Profile[] {
  const services = entries(stack, "service");
  return entries(stack, "profile").map((profile) => ({
    id: text(profile["id"]),
    description: text(profile["description"]),
    services: services
      .filter((service) => service["profile"] === profile["id"])
      .map((service) => text(service["name"])),
  }));
}

/** Every form, each with the profiles its closure names. */
export function formsOf(stack: string): Form[] {
  return entries(stack, "form").map((form) => {
    const profiles = form["profiles"];
    return {
      id: text(form["id"]),
      description: text(form["description"]),
      profiles: Array.isArray(profiles) ? profiles.map(text) : [],
    };
  });
}

/**
 * Every service, with the smallest form that starts it: of the forms whose
 * closure holds its profile, the one starting the fewest services, the first
 * declared where two start as many.
 */
export function servicesOf(stack: string): Service[] {
  const services = entries(stack, "service");
  const forms = formsOf(stack).map((form) => ({
    id: form.id,
    profiles: form.profiles,
    size: services.filter((service) =>
      form.profiles.includes(text(service["profile"])),
    ).length,
  }));
  return services.map((service) => {
    const starting = forms.filter((form) =>
      form.profiles.includes(text(service["profile"])),
    );
    const smallest = starting.reduce<(typeof forms)[number] | null>(
      (best, form) => (best === null || form.size < best.size ? form : best),
      null,
    );
    const port = service["port"];
    return {
      name: text(service["name"]),
      describes: text(service["describes"]),
      withoutIt: text(service["without_it"]),
      port: typeof port === "number" ? port : null,
      bind: typeof service["bind"] === "string" ? service["bind"] : null,
      criticality: text(service["criticality"]),
      smallestForm: smallest?.id ?? null,
    };
  });
}

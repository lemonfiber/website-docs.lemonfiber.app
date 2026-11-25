/**
 * The profiles, forms and services of the stack the pinned bundle ships, as the
 * pages set them out.
 *
 * `running/forms-and-slices` and `running/the-services` render their tables from
 * these rather than writing them down, so a service added, moved or reworded is
 * on the page in the build that pins it.
 *
 * Pure functions over the bundle's text.
 */
import { parse, stringify } from "smol-toml";

/** One profile, and the services that carry it. */
export interface Profile {
  readonly id: string;
  readonly description: string;
  /** The services' display names, in the order the bundle pins them. */
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

/** The pinned plugins repository's bundle, and its root within it. */
export const BUNDLE_CHECKOUT = "vendor/lemonfiber-plugins/bundle";
export const BUNDLE_ROOT = "bundle.toml";

type Table = Record<string, unknown>;

/** Where the copy of a pinned plugin's manifest sits, from the bundle's root. */
export const pluginManifest = (id: string): string =>
  `plugins/${id}/plugin.toml`;

const isTable = (value: unknown): value is Table =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parsed = (text: string | null): Table | null => {
  if (text === null) return null;
  try {
    return parse(text);
  } catch {
    return null;
  }
};

const tablesIn = (read: Table, name: string): Table[] => {
  const found = read[name];
  return Array.isArray(found) ? found.filter(isTable) : [];
};

const withIdFirst = (table: Table): Table => ({ id: table["id"], ...table });

/**
 * The stack service a pinned plugin stands for: named and described by its
 * manifest's `[plugin]`, in the profile its pin names, published as the
 * manifest's service whose id is the plugin's.
 */
const serviceOf = (pin: Table, manifest: Table): Table => {
  const plugin = isTable(manifest["plugin"]) ? manifest["plugin"] : {};
  const own =
    tablesIn(manifest, "service").find(
      (service) => service["id"] === pin["id"],
    ) ?? {};
  return {
    id: pin["id"],
    name: plugin["name"],
    describes: plugin["description"],
    without_it: plugin["without_it"],
    upstream: plugin["upstream"],
    profile: pin["profile"],
    port: own["port"],
    bind: own["bind"],
    criticality: own["criticality"],
  };
};

/**
 * The stack the bundle ships, as one manifest: its `[[profile]]` and `[[form]]`
 * tables as the bundle declares them, and one `[[service]]` per `[[plugin]]`
 * pin, each table with its `id` first. `read` answers a path from the bundle's
 * root with its text, or null; a pin whose manifest it cannot answer is left
 * out. A bundle that is not there, or declares none of these, is an empty
 * manifest.
 */
export function bundledStack(
  bundle: string | null,
  read: (entry: string) => string | null,
): string {
  const root = parsed(bundle);
  if (root === null) return "";
  const services = tablesIn(root, "plugin").flatMap((pin) => {
    const id = pin["id"];
    if (typeof id !== "string") return [];
    const manifest = parsed(read(pluginManifest(id)));
    return manifest === null ? [] : [serviceOf(pin, manifest)];
  });
  const stack = Object.entries({
    profile: tablesIn(root, "profile").map(withIdFirst),
    form: tablesIn(root, "form").map(withIdFirst),
    service: services,
  }).filter(([, tables]) => tables.length > 0);
  return stack.length === 0 ? "" : stringify(Object.fromEntries(stack));
}

/** The `[[name]]` entries of the manifest, or none where it does not parse. */
const entries = (stack: string, name: string): Table[] =>
  tablesIn(parsed(stack) ?? {}, name);

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

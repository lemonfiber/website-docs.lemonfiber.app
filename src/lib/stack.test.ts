import { readFileSync } from "node:fs";

import { inStack, stack } from "./schema-source.ts";

import { describe, expect, it } from "vitest";

import {
  formsOf,
  includedIn,
  joinedStack,
  profilesOf,
  servicesOf,
  STACK_CHECKOUT,
  STACK_ROOT,
} from "./stack.ts";

const STACK = [
  "[[profile]]",
  'id = "search"',
  'name = "Indexers"',
  'description = "Finding things"',
  "",
  "[[profile]]",
  'id = "dash"',
  "",
  "[[form]]",
  'id = "search"',
  'description = "Find things."',
  'profiles = ["search"]',
  "",
  "[[form]]",
  'id = "odd"',
  'profiles = "search"',
  "",
  "[[service]]",
  'id = "prowlarr"',
  'name = "Prowlarr"',
  'profile = "search"',
  "",
  "[[service]]",
  'id = "flaresolverr"',
  'name = "FlareSolverr"',
  'profile = "search"',
  "",
].join("\n");

describe("profilesOf", () => {
  it("names each profile's services, in the manifest's order", () => {
    expect(profilesOf(STACK)).toEqual([
      {
        id: "search",
        description: "Finding things",
        services: ["Prowlarr", "FlareSolverr"],
      },
      { id: "dash", description: "", services: [] },
    ]);
  });

  it("reads nothing out of what is not a manifest", () => {
    expect(profilesOf("= not toml")).toEqual([]);
    expect(profilesOf('profile = "x"')).toEqual([]);
  });

  it("reads the stack this site pins", () => {
    const text = (path: string): string =>
      readFileSync(`${STACK_CHECKOUT}/${path}`, "utf8");
    const read = profilesOf(joinedStack(text(STACK_ROOT), text));
    expect(read.length).toBeGreaterThan(0);
    expect(read.every((profile) => profile.services.length > 0)).toBe(true);
  });
});

describe("formsOf", () => {
  it("names each form's profiles", () => {
    expect(formsOf(STACK)).toEqual([
      { id: "search", description: "Find things.", profiles: ["search"] },
      { id: "odd", description: "", profiles: [] },
    ]);
  });
});

describe("servicesOf", () => {
  const stack = [
    "[[form]]",
    'id = "hunt"',
    'profiles = ["search", "usenet"]',
    "",
    "[[form]]",
    'id = "search"',
    'profiles = ["search"]',
    "",
    "[[form]]",
    'id = "also"',
    'profiles = ["search"]',
    "",
    "[[service]]",
    'id = "prowlarr"',
    'name = "Prowlarr"',
    'profile = "search"',
    'describes = "Holds your indexers"',
    'without_it = "Configure each app"',
    "port = 9696",
    'bind = "loopback"',
    'criticality = "core"',
    "",
    "[[service]]",
    'id = "sabnzbd"',
    'name = "SABnzbd"',
    'profile = "usenet"',
    'criticality = "core"',
    "",
    "[[service]]",
    'id = "caddy"',
    'name = "Caddy"',
    'profile = "proxy"',
    "",
  ].join("\n");

  it("reads each service and the smallest form that starts it", () => {
    expect(servicesOf(stack)).toEqual([
      {
        name: "Prowlarr",
        describes: "Holds your indexers",
        withoutIt: "Configure each app",
        port: 9696,
        bind: "loopback",
        criticality: "core",
        smallestForm: "search",
      },
      {
        name: "SABnzbd",
        describes: "",
        withoutIt: "",
        port: null,
        bind: null,
        criticality: "core",
        smallestForm: "hunt",
      },
      {
        name: "Caddy",
        describes: "",
        withoutIt: "",
        port: null,
        bind: null,
        criticality: "",
        smallestForm: null,
      },
    ]);
  });
});

describe("joinedStack", () => {
  const root = [
    "schema_version = 1",
    'include = ["services/prowlarr.toml", "services/gone.toml", 3]',
    "",
    "[[profile]]",
    'id = "search"',
    'description = "Finding things"',
  ].join("\n");
  const files: Record<string, string> = {
    "services/prowlarr.toml":
      '[[service]]\nid = "prowlarr"\nname = "Prowlarr"\nprofile = "search"\n',
  };
  const read = (entry: string): string | null => files[entry] ?? null;

  it("names the files a root includes, in order, and only the paths", () => {
    expect(includedIn(root)).toEqual([
      "services/prowlarr.toml",
      "services/gone.toml",
    ]);
    expect(includedIn("schema_version = 1")).toEqual([]);
    expect(includedIn('include = "services/x.toml"')).toEqual([]);
    expect(includedIn("= not toml")).toEqual([]);
  });

  it("reads a split manifest as one, root first, leaving out what it cannot read", () => {
    const joined = joinedStack(root, read);
    expect(joined.startsWith(root)).toBe(true);
    expect(joined).toContain("# services/prowlarr.toml");
    expect(joined).not.toContain("services/gone.toml\n[");
    expect(profilesOf(joined)).toEqual([
      { id: "search", description: "Finding things", services: ["Prowlarr"] },
    ]);
  });

  it("takes a manifest with no include list as it stands", () => {
    expect(joinedStack(STACK, read)).toBe(STACK);
  });

  it("reads a root that is not there as an empty manifest", () => {
    expect(joinedStack(null, read)).toBe("");
  });
});

describe("the pinned stack", () => {
  it("is read from the checkout, its service files with it", () => {
    expect(profilesOf(stack()).length).toBeGreaterThan(0);
    expect(inStack(STACK_ROOT)).not.toBeNull();
    expect(inStack("services/not-a-service.toml")).toBeNull();
  });
});

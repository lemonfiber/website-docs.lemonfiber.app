import { readFileSync } from "node:fs";

import { inBundle, stack } from "./schema-source.ts";

import { describe, expect, it } from "vitest";

import {
  BUNDLE_CHECKOUT,
  BUNDLE_ROOT,
  bundledStack,
  formsOf,
  pluginManifest,
  profilesOf,
  servicesOf,
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
      readFileSync(`${BUNDLE_CHECKOUT}/${path}`, "utf8");
    const joined = bundledStack(text(BUNDLE_ROOT), text);
    const read = profilesOf(joined);
    expect(read.length).toBeGreaterThan(0);
    expect(read.flatMap((profile) => profile.services)).toHaveLength(
      servicesOf(joined).length,
    );
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

describe("bundledStack", () => {
  const upstream = ["https:", "//github.com/Prowlarr/Prowlarr"].join("");
  const bundle = [
    "schema = 2",
    "",
    "[[profile]]",
    'name = "Indexers"',
    'id = "search"',
    'description = "Finding things"',
    "",
    "[[form]]",
    'id = "search"',
    'description = "Find things."',
    'profiles = ["search"]',
    "",
    "[[wiring]]",
    'id = "prowlarr-to-sonarr"',
    "",
    "[[plugin]]",
    'id = "prowlarr"',
    'profile = "search"',
    "",
    "[[plugin]]",
    'id = "flaresolverr"',
    'profile = "search"',
    "",
    "[[plugin]]",
    'id = "gone"',
    'profile = "search"',
    "",
    "[[plugin]]",
    "revision = 3",
    "",
    "[[offered]]",
    'id = "nzbget"',
    'profile = "usenet"',
  ].join("\n");
  const files: Record<string, string> = {
    [pluginManifest("prowlarr")]: [
      "[plugin]",
      'id = "prowlarr"',
      'name = "Prowlarr"',
      'description = "Searches indexers"',
      'without_it = "Search each indexer yourself"',
      `upstream = "${upstream}"`,
      "",
      "[[service]]",
      'id = "prowlarr-adapter"',
      "port = 1",
      "",
      "[[service]]",
      'id = "prowlarr"',
      "port = 9696",
      'bind = "loopback"',
      'criticality = "core"',
    ].join("\n"),
    [pluginManifest("flaresolverr")]: [
      "[plugin]",
      'id = "flaresolverr"',
      'name = "FlareSolverr"',
    ].join("\n"),
    [pluginManifest("nzbget")]: '[plugin]\nname = "NZBGet"\n',
  };
  const read = (entry: string): string | null => files[entry] ?? null;

  it("sets out the bundle's profiles and forms, and a service per plugin it pins", () => {
    const joined = bundledStack(bundle, read);
    expect(profilesOf(joined)).toEqual([
      {
        id: "search",
        description: "Finding things",
        services: ["Prowlarr", "FlareSolverr"],
      },
    ]);
    expect(formsOf(joined)).toEqual([
      { id: "search", description: "Find things.", profiles: ["search"] },
    ]);
    expect(servicesOf(joined)).toEqual([
      {
        name: "Prowlarr",
        describes: "Searches indexers",
        withoutIt: "Search each indexer yourself",
        port: 9696,
        bind: "loopback",
        criticality: "core",
        smallestForm: "search",
      },
      {
        name: "FlareSolverr",
        describes: "",
        withoutIt: "",
        port: null,
        bind: null,
        criticality: "",
        smallestForm: "search",
      },
    ]);
  });

  it("writes every table with its id first, the shape the counts read", () => {
    const joined = bundledStack(bundle, read);
    expect(joined).toContain('[[profile]]\nid = "search"\n');
    expect(joined).toContain('[[service]]\nid = "prowlarr"\n');
    expect(joined).toContain(`upstream = "${upstream}"`);
    expect(joined).not.toContain("wiring");
    expect(joined).not.toContain("NZBGet");
  });

  it("reads a bundle with no parts, or none at all, as an empty stack", () => {
    expect(bundledStack(null, read)).toBe("");
    expect(bundledStack("= not toml", read)).toBe("");
    expect(bundledStack("schema = 2", read)).toBe("");
    expect(bundledStack('profile = "x"\nplugin = [1]', read)).toBe("");
    expect(bundledStack("profile = [[1]]", read)).toBe("");
    expect(servicesOf(bundledStack(null, read))).toEqual([]);
  });

  it("names no service a manifest without a [plugin] table describes", () => {
    const bare = (entry: string): string | null =>
      entry === pluginManifest("bare")
        ? 'plugin = 3\n[[service]]\nid = "bare"\nport = 80'
        : null;
    expect(bundledStack('[[plugin]]\nid = "bare"\nprofile = "x"', bare)).toBe(
      '[[service]]\nid = "bare"\nprofile = "x"\nport = 80\n',
    );
  });

  it("leaves out a pin whose manifest is missing or unreadable", () => {
    const unreadable = (entry: string): string | null =>
      entry === pluginManifest("prowlarr") ? "= not toml" : null;
    expect(bundledStack('[[plugin]]\nid = "prowlarr"', unreadable)).toBe("");
    expect(bundledStack("[[plugin]]\nid = 3", () => "[plugin]")).toBe("");
  });
});

describe("the pinned bundle", () => {
  it("is read from the checkout, its plugin manifests with it", () => {
    expect(profilesOf(stack()).length).toBeGreaterThan(0);
    expect(servicesOf(stack()).length).toBeGreaterThan(0);
    expect(inBundle(BUNDLE_ROOT)).not.toBeNull();
    expect(inBundle(pluginManifest("not-a-plugin"))).toBeNull();
  });
});

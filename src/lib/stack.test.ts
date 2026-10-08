import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { formsOf, profilesOf, servicesOf } from "./stack.ts";

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
    const read = profilesOf(
      readFileSync("vendor/lemonfiber-media-stack/stack.toml", "utf8"),
    );
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

import { describe, expect, it } from "vitest";

import { parseVersions, routeIn, targetOf, versionsIndex } from "./versions.ts";

const INDEX = versionsIndex([
  { label: "0.16", path: "/v0.16/", routes: ["/", "/start/"] },
  {
    label: "next",
    path: "/next/",
    routes: ["/", "/start/", "/api/python-sdk/"],
  },
  { label: "0.17", path: "/", routes: ["/", "/start/", "/api/python-sdk/"] },
]);

describe("versionsIndex", () => {
  it("lists next first and then the releases, newest first, with each one's routes", () => {
    expect(INDEX.versions).toEqual([
      { label: "next", path: "/next/" },
      { label: "0.17", path: "/" },
      { label: "0.16", path: "/v0.16/" },
    ]);
    expect(INDEX.routes["/v0.16/"]).toEqual(["/", "/start/"]);
  });

  it("orders a two-part and a three-part label by number", () => {
    expect(
      versionsIndex([
        { label: "0.9", path: "/v0.9/", routes: [] },
        { label: "0.10", path: "/v0.10/", routes: [] },
        { label: "0.10.1", path: "/v0.10.1/", routes: [] },
        { label: "0.10", path: "/x/", routes: [] },
      ]).versions.map((one) => one.path),
    ).toEqual(["/v0.10.1/", "/v0.10/", "/x/", "/v0.9/"]);
  });
});

describe("routeIn", () => {
  it("takes the build's path off the page's", () => {
    expect(routeIn("/v0.16/start/", "/v0.16/")).toBe("/start/");
    expect(routeIn("/next/start/", "/next")).toBe("/start/");
    expect(routeIn("/start/", "/")).toBe("/start/");
    expect(routeIn("/other/start/", "/next/")).toBe("/other/start/");
  });
});

describe("targetOf", () => {
  it("sends a reader to the same route where the version serves it, else to its front page", () => {
    expect(targetOf(INDEX, "/v0.16/", "/start/")).toBe("/v0.16/start/");
    expect(targetOf(INDEX, "/v0.16/", "/api/python-sdk/")).toBe("/v0.16/");
    expect(targetOf(INDEX, "/", "/api/python-sdk/")).toBe("/api/python-sdk/");
    expect(targetOf(INDEX, "/v9/", "/start/")).toBe("/v9/");
  });
});

describe("parseVersions", () => {
  it("reads the index back, and nothing out of what is not one", () => {
    expect(parseVersions(JSON.stringify(INDEX))).toEqual(INDEX);
    expect(parseVersions("not json")).toBeNull();
    expect(parseVersions("null")).toBeNull();
    expect(parseVersions('{"versions": []}')).toBeNull();
    expect(parseVersions('{"versions": {}, "routes": {}}')).toBeNull();
  });
});

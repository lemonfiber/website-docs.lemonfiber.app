import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { baseIntegration, place, rebase, underBase, withBase } from "./base.ts";

const made: string[] = [];
afterEach(() => {
  for (const one of made.splice(0))
    rmSync(one, { recursive: true, force: true });
});

const tree = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "docs-base-"));
  made.push(root);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
};

describe("underBase", () => {
  it("puts a root-relative address under the base, once", () => {
    expect(underBase("/fixing/", "/next/")).toBe("/next/fixing/");
    expect(underBase("/next/fixing/", "/next/")).toBe("/next/fixing/");
    expect(underBase("/next", "/next/")).toBe("/next");
    expect(underBase("/nextish/", "/next")).toBe("/next/nextish/");
  });

  it("leaves the root build, other origins and relative addresses alone", () => {
    expect(underBase("/fixing/", "/")).toBe("/fixing/");
    expect(underBase("//cdn.test/x", "/next/")).toBe("//cdn.test/x");
    expect(underBase("other/", "/next/")).toBe("other/");
  });
});

describe("withBase", () => {
  it("rewrites links, sources and a redirect's refresh, and nothing else", () => {
    const html =
      '<a href="/fixing/">x</a><img src="/a.png"><meta http-equiv="refresh" content="0;url=/start/"><a href="#top">t</a><p>/fixing/</p>';
    expect(
      withBase(html, { base: "/v0.17/", fallback: null }, () => true),
    ).toBe(
      '<a href="/v0.17/fixing/">x</a><img src="/v0.17/a.png"><meta http-equiv="refresh" content="0;url=/v0.17/start/"><a href="#top">t</a><p>/fixing/</p>',
    );
  });
});

describe("place", () => {
  const has = (route: string): boolean => route !== "/api/new/";
  const versioned = { base: "/v0.16/", fallback: "/next/" };

  it("reads a page this build has under its base, written with the base or without", () => {
    expect(place("/start/", versioned, has)).toBe("/v0.16/start/");
    expect(place("/v0.16/start/#a", versioned, has)).toBe("/v0.16/start/#a");
  });

  it("leaves an address already in the fallback version where it is", () => {
    expect(place("/next/start/", versioned, has)).toBe("/next/start/");
    expect(place("/next/fixing/", { base: "/", fallback: "/next/" }, has)).toBe(
      "/next/fixing/",
    );
  });

  it("sends a reader to the fallback for a page this build lacks", () => {
    expect(place("/api/new/", versioned, has)).toBe("/next/api/new/");
    expect(place("/v0.16/api/new/?q#h", versioned, has)).toBe(
      "/next/api/new/?q#h",
    );
    expect(place("/api/new/", { base: "/", fallback: "/next/" }, has)).toBe(
      "/next/api/new/",
    );
  });

  it("reads a base or a fallback written without its last slash", () => {
    expect(
      place("/v0.16/api/new/", { base: "/v0.16", fallback: "/next" }, has),
    ).toBe("/next/api/new/");
  });

  it("leaves an asset, another origin and the build from the pins alone", () => {
    expect(place("/_astro/x.css", versioned, has)).toBe("/v0.16/_astro/x.css");
    expect(place("//cdn.test/x/", versioned, has)).toBe("//cdn.test/x/");
    expect(place("/api/new/", { base: "/", fallback: null }, has)).toBe(
      "/api/new/",
    );
  });
});

describe("rebase", () => {
  it("sends a page this build lacks to the fallback, from what the build holds", async () => {
    const root = tree({
      "index.html": '<a href="/start/">s</a><a href="/later/">l</a>',
      "start/index.html": "start",
    });
    expect(await rebase(root, { base: "/", fallback: "/next/" })).toBe(1);
    expect(readFileSync(join(root, "index.html"), "utf8")).toBe(
      '<a href="/start/">s</a><a href="/next/later/">l</a>',
    );
  });

  it("rewrites every page under the directory and counts the ones it changed", async () => {
    const root = tree({
      "index.html": '<a href="/start/">s</a>',
      "deep/page/index.html": '<a href="#x">x</a>',
      "style.css": "a { background: url(/x.png) }",
    });
    expect(await rebase(root, { base: "/next/", fallback: null })).toBe(1);
    expect(readFileSync(join(root, "index.html"), "utf8")).toBe(
      '<a href="/next/start/">s</a>',
    );
    expect(readFileSync(join(root, "style.css"), "utf8")).toContain(
      "url(/x.png)",
    );
  });

  it("touches nothing for the build at the root", async () => {
    const root = tree({ "index.html": '<a href="/start/">s</a>' });
    expect(await rebase(root, { base: "/", fallback: null })).toBe(0);
  });
});

describe("baseIntegration", () => {
  it("rebases the built site once the build is done, and says so", async () => {
    const root = tree({ "index.html": '<a href="/start/">s</a>' });
    const info = vi.fn();
    const hook = baseIntegration({ base: "/next/", fallback: null }).hooks[
      "astro:build:done"
    ];
    type Options = Parameters<NonNullable<typeof hook>>[0];
    const options = {
      pages: [],
      dir: new URL(`file://${root}/`),
      assets: new Map(),
      logger: { info } as unknown as Options["logger"],
    } satisfies Options;

    await hook?.(options);
    expect(info).toHaveBeenCalledWith("1 page(s) placed under /next/");

    await hook?.(options);
    expect(info).toHaveBeenCalledTimes(1);
  });
});

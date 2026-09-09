import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CLIENTS,
  contractViolations,
  CONTRACTS,
  DIFFERS,
  kindsIn,
  SAME,
  saidOn,
  SERVED,
  type Copy,
} from "./contracts.ts";
import type { Page } from "./counts.ts";
import { GUARDED } from "./pins.ts";

const artefact = (...kinds: string[]): string =>
  JSON.stringify({
    kinds: Object.fromEntries(kinds.map((kind) => [kind, {}])),
  });

const SERVES = artefact("error", "log", "status");

const copy = (text: string): Copy => ({
  name: "the PHP client",
  source: "vendor/sdk-php/contract/web-api.contract.json",
  page: "src/content/docs/api/php-sdk.md",
  text,
});

const page = (text: string): Page => ({
  path: "src/content/docs/api/php-sdk.md",
  text,
});

const AGREES = page(`Its copy ${SAME}.`);
const DIVERGES = page(`Its copy ${DIFFERS}.`);

describe("kindsIn", () => {
  it("takes the kinds an artefact describes", () => {
    expect(kindsIn(SERVES)).toEqual(["error", "log", "status"]);
  });

  it("finds none in something that is not an artefact", () => {
    expect(kindsIn("not json")).toEqual([]);
  });
});

describe("saidOn", () => {
  it("reads the shape a page states where the sets agree", () => {
    expect(saidOn(AGREES.text)).toBe("same");
  });

  it("reads the shape a page states where they do not", () => {
    expect(saidOn(DIVERGES.text)).toBe("differs");
  });

  it("reads a sentence that wrapped where the line ended", () => {
    expect(saidOn(SAME.replace(" kinds ", "\nkinds "))).toBe("same");
  });

  it("names a page that states both shapes", () => {
    expect(saidOn(`${SAME}. ${DIFFERS}.`)).toBe("both");
  });

  it("names a page that states neither", () => {
    expect(saidOn("The client reads every reply.")).toBe("neither");
  });
});

describe("contractViolations", () => {
  it("passes a copy that agrees, and a page that says so", () => {
    expect(contractViolations(SERVES, [copy(SERVES)], [AGREES])).toEqual([]);
  });

  it("passes a copy that does not, and a page that says so", () => {
    expect(
      contractViolations(SERVES, [copy(artefact("error", "log"))], [DIVERGES]),
    ).toEqual([]);
  });

  it("refuses a served artefact with no kinds, rather than reading as clean", () => {
    expect(contractViolations("", [copy(SERVES)], [AGREES])).toEqual([
      {
        where: SERVED,
        line: null,
        message: "no kinds found — the contract is missing or unreadable",
      },
    ]);
  });

  it("refuses a copy with no kinds, rather than reading as clean", () => {
    expect(contractViolations(SERVES, [copy("")], [AGREES])).toEqual([
      {
        where: "vendor/sdk-php/contract/web-api.contract.json",
        line: null,
        message: "no kinds found — the copy is missing or unreadable",
      },
    ]);
  });

  it("names the kinds a copy the page calls the same has not, in name order", () => {
    expect(
      contractViolations(SERVES, [copy(artefact("error"))], [AGREES]).map(
        (one) => one.message,
      ),
    ).toEqual([
      `says the copy ${SAME}, and the binary serves these and the copy has not: log, status`,
    ]);
  });

  it("names the kinds a copy has that the binary does not serve", () => {
    expect(
      contractViolations(
        SERVES,
        [copy(artefact("error", "log", "status", "wizard"))],
        [AGREES],
      ).map((one) => one.message),
    ).toEqual([
      `says the copy ${SAME}, and the copy has these and the binary serves none of them: wizard`,
    ]);
  });

  it("names both directions where the sets differ in both", () => {
    expect(
      contractViolations(
        SERVES,
        [copy(artefact("error", "log", "wizard"))],
        [AGREES],
      ).map((one) => one.message),
    ).toEqual([
      `says the copy ${SAME}, and the binary serves these and the copy has not: status; ` +
        "the copy has these and the binary serves none of them: wizard",
    ]);
  });

  it("names a page that calls a copy different where every kind is in both", () => {
    expect(
      contractViolations(SERVES, [copy(SERVES)], [DIVERGES]).map(
        (one) => one.message,
      ),
    ).toEqual([`says the copy ${DIFFERS}, and every kind is in both`]);
  });

  it("names a page that states both shapes at once", () => {
    expect(
      contractViolations(
        SERVES,
        [copy(SERVES)],
        [page(`${SAME}. ${DIFFERS}.`)],
      ).map((one) => one.message),
    ).toEqual([
      `says the copy both ${SAME} and ${DIFFERS}, which is one claim too many`,
    ]);
  });

  it("refuses a rewording that left the page saying neither", () => {
    expect(
      contractViolations(
        SERVES,
        [copy(SERVES)],
        [page("The client reads every reply.")],
      ).map((one) => one.message),
    ).toEqual([
      `says neither that the PHP client's copy ${SAME} nor that it ${DIFFERS} — a rewording left this watching nothing`,
    ]);
  });

  it("refuses a page that is not in the tree at all", () => {
    expect(
      contractViolations(SERVES, [copy(SERVES)], []).map((one) => one.where),
    ).toEqual(["src/content/docs/api/php-sdk.md"]);
  });

  it("holds this site's pages to the artefacts this repository pins", () => {
    const copies = CLIENTS.map((client) => ({
      ...client,
      text: readFileSync(client.source, "utf8"),
    }));
    const pages = CLIENTS.map((client) => ({
      path: client.page,
      text: readFileSync(client.page, "utf8"),
    }));

    expect(
      contractViolations(readFileSync(SERVED, "utf8"), copies, pages),
    ).toEqual([]);
  });
});

describe("what this rule reads", () => {
  it("is watched, so a pin cannot go behind it unnoticed", () => {
    for (const path of CONTRACTS) expect(GUARDED).toContain(path);
  });

  it("names the served artefact and every client's copy", () => {
    expect(CONTRACTS).toEqual([SERVED, ...CLIENTS.map((one) => one.source)]);
  });
});

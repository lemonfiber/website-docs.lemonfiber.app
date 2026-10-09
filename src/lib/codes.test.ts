import { describe, expect, it } from "vitest";

import {
  codeViolations,
  FAMILIES,
  familyViolations,
  INDEX,
  isFamilyPage,
  linkOf,
  mentionViolations,
  pageOf,
} from "./codes.ts";
import type { Page } from "./counts.ts";
import { REGISTRY, type Code, type Registry } from "./registry.ts";

const code = (id: string, family: string): Code => ({
  code: id,
  family,
  name: "A",
  severity: "error",
  exit: 1,
  status: 500,
  summary: "s",
  meaning: "m",
  remedy: "r",
  since: "0.1.0",
});

const REG: Registry = {
  families: [
    { prefix: "VPN", covers: "traffic leaving the tunnel" },
    { prefix: "LIFE", covers: "starting and stopping" },
  ],
  codes: [code("VPN-1", "VPN"), code("VPN-2", "VPN"), code("LIFE-1", "LIFE")],
  retired: ["LIFE-9"],
};

const familyPage = (prefix: string, title: string, body: string): Page => ({
  path: pageOf(prefix),
  text: `---\ntitle: ${title}\n---\n\nIntro.\n\n${body}\n`,
});

const VPN_PAGE = familyPage(
  "VPN",
  "VPN — traffic leaving the tunnel",
  '<CodeTable family="VPN" />',
);
const LIFE_PAGE = familyPage(
  "LIFE",
  "LIFE — starting and stopping",
  '<CodeTable family="LIFE" />',
);
const GOOD = [VPN_PAGE, LIFE_PAGE];

const INDEX_TEXT = "Every family:\n\n<CodeFamilies />\n";

describe("where the pages are", () => {
  it("keeps a family's page and route by its prefix in lower case", () => {
    expect(pageOf("VPN")).toBe(`${FAMILIES}/vpn.mdx`);
    expect(linkOf("VPN")).toBe("/fixing/codes/vpn/");
    expect(isFamilyPage({ path: `${FAMILIES}/vpn.md`, text: "" })).toBe(true);
    expect(isFamilyPage({ path: `${FAMILIES}/vpn.txt`, text: "" })).toBe(false);
    expect(isFamilyPage({ path: INDEX, text: "" })).toBe(false);
  });
});

describe("codeViolations", () => {
  it("passes a page for every family, each rendering its own table under its title", () => {
    expect(codeViolations(REG, INDEX_TEXT, GOOD)).toEqual([]);
  });

  it("refuses a missing registry", () => {
    expect(codeViolations(null, INDEX_TEXT, GOOD)).toEqual([
      expect.objectContaining({ where: REGISTRY }),
    ]);
  });

  it("names a family with no page, and a page for no family", () => {
    const found = codeViolations(REG, INDEX_TEXT, [
      VPN_PAGE,
      familyPage("GONE", "GONE — nothing", '<CodeTable family="GONE" />'),
    ]);
    expect(found.map((one) => `${one.where} ${one.message}`)).toEqual([
      `${pageOf("LIFE")} the \`LIFE\` family raises LIFE-1 and has no page`,
      `${pageOf("GONE")} the registry declares no \`GONE\` family`,
    ]);
  });

  it("names a page that renders no table, another family's, or two", () => {
    const messages = (body: string): string[] =>
      codeViolations(REG, INDEX_TEXT, [
        familyPage("VPN", "VPN — traffic leaving the tunnel", body),
        LIFE_PAGE,
      ]).map((one) => one.message);
    expect(messages("No table.")).toEqual([
      'renders no code table, where it is `VPN`\'s page: write <CodeTable family="VPN" /> once',
    ]);
    expect(messages('<CodeTable family="LIFE" />')).toEqual([
      'renders the tables of LIFE, where it is `VPN`\'s page: write <CodeTable family="VPN" /> once',
    ]);
    expect(
      messages('<CodeTable family="VPN" />\n<CodeTable family="VPN" />'),
    ).toHaveLength(1);
  });

  it("names a title that is not the family's, and a page with none", () => {
    expect(
      codeViolations(REG, INDEX_TEXT, [
        familyPage("VPN", "VPN — the tunnel", '<CodeTable family="VPN" />'),
        { path: pageOf("LIFE"), text: '<CodeTable family="LIFE" />' },
      ]).map((one) => one.message),
    ).toEqual([
      'is titled otherwise than "VPN — traffic leaving the tunnel"',
      'is titled otherwise than "LIFE — starting and stopping"',
    ]);
  });

  it("names a row written by hand, where it stands", () => {
    const found = codeViolations(REG, INDEX_TEXT, [
      familyPage(
        "VPN",
        "VPN — traffic leaving the tunnel",
        '<CodeTable family="VPN" />\n\n| `VPN-1` | by hand |',
      ),
      LIFE_PAGE,
    ]);
    expect(found).toEqual([
      {
        where: pageOf("VPN"),
        line: 9,
        message: "writes a code's row by hand; the table is the registry's",
      },
    ]);
  });

  it("names an index that does not list the families", () => {
    expect(codeViolations(REG, "No listing.", GOOD)).toEqual([
      expect.objectContaining({ where: INDEX }),
    ]);
  });
});

describe("familyViolations", () => {
  const page = (text: string): Page => ({
    path: "src/content/docs/a.md",
    text,
  });

  it("passes a sentence counting a family as the registry does", () => {
    expect(familyViolations(REG, [page("The two `VPN` codes.")])).toEqual([]);
  });

  it("names a wrong count where it stands, and skips a family the registry lacks", () => {
    expect(
      familyViolations(REG, [
        page("Intro.\nThe three `VPN` codes, and the two `NOPE` codes."),
      ]),
    ).toEqual([
      {
        where: "src/content/docs/a.md",
        line: 2,
        message: `says three \`VPN\` codes where ${REGISTRY} declares two`,
      },
    ]);
  });

  it("refuses a missing registry, and a site that states no count", () => {
    expect(familyViolations(null, [])).toEqual([
      expect.objectContaining({ where: REGISTRY }),
    ]);
    expect(familyViolations(REG, [page("Nothing counted.")])).toEqual([
      expect.objectContaining({ where: REGISTRY, line: null }),
    ]);
  });
});

describe("mentionViolations", () => {
  const page = (text: string): Page => ({
    path: "src/content/docs/a.md",
    text,
  });

  it("passes a code the core raises, and names one it retired or never had", () => {
    expect(
      mentionViolations(REG, [page("A `VPN-1`.\nA `LIFE-9`.\nA `VPN-7`.")]),
    ).toEqual([
      {
        where: "src/content/docs/a.md",
        line: 2,
        message: `names \`LIFE-9\`, which ${REGISTRY} lists as retired`,
      },
      {
        where: "src/content/docs/a.md",
        line: 3,
        message: `names \`VPN-7\`, which ${REGISTRY} does not declare`,
      },
    ]);
  });

  it("refuses a missing registry", () => {
    expect(mentionViolations(null, [])).toEqual([
      expect.objectContaining({ where: REGISTRY }),
    ]);
  });
});

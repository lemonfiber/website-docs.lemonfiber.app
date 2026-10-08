import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { Page } from "./counts.ts";
import { DASHBOARD, panelsIn, panelViolations, TUI_PAGE } from "./terminal.ts";

const LAYOUT = [
  "    vec![",
  '        ("VPN", vpn),',
  '        ("Front door", door),',
  '        call("Not a panel", door),',
  '        ("Not a panel", door), // nor this',
  "    ]",
].join("\n");

const page = (text: string): Page => ({ path: TUI_PAGE, text });

const TABLE =
  "A header and two panels.\n\n| Panel | What it carries |\n| --- | --- |\n| VPN | x |\n| Front door | y |\n";

describe("panelsIn", () => {
  it("reads each panel's heading in the order it is laid out", () => {
    expect(panelsIn(LAYOUT)).toEqual(["VPN", "Front door"]);
  });

  it("reads the layout the pinned core draws", () => {
    expect(panelsIn(readFileSync(DASHBOARD, "utf8"))).toContain("VPN");
  });
});

describe("panelViolations", () => {
  it("passes a page whose table and count are the layout's", () => {
    expect(panelViolations(LAYOUT, [page(TABLE)])).toEqual([]);
  });

  it("names a panel missing either way, and a wrong count where it stands", () => {
    const found = panelViolations(LAYOUT, [
      page(
        "Intro.\n\nThree panels.\n\n| Panel | x |\n| --- | --- |\n| VPN | x |\n| Gone | y |\n",
      ),
    ]);
    expect(found.map((one) => [one.line, one.message])).toEqual([
      [null, `${DASHBOARD} draws these and the page does not: Front door`],
      [null, `the page has these and ${DASHBOARD} does not draw them: Gone`],
      [3, `says Three panels where ${DASHBOARD} draws two`],
    ]);
  });

  it("refuses a page that no longer counts them, and one that is missing", () => {
    expect(
      panelViolations(LAYOUT, [page(TABLE.replace("two panels", "panels"))])[0]
        ?.message,
    ).toMatch(/watching nothing/);
    expect(panelViolations(LAYOUT, [])).toEqual([
      expect.objectContaining({ where: TUI_PAGE, line: null }),
    ]);
  });

  it("refuses a layout with no panels rather than passing on it", () => {
    expect(panelViolations("", [page(TABLE)])).toEqual([
      expect.objectContaining({ where: DASHBOARD, line: null }),
    ]);
  });
});

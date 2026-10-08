import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { checkViolations, REGISTER, registered, VPN_PAGE } from "./checks.ts";
import type { Page } from "./counts.ts";

const REGISTERED = [
  "pub const BUNDLED_CHECKS: &[&str] = &[",
  '    "credentials.",',
  '    "vpn.leaks.",',
  '    "storage.single-mount",',
  '    "vpn.tunnel",',
  '    "vpn.unprotected",',
  "];",
].join("\n");

const VPN = (rows: string): Page => ({
  path: VPN_PAGE,
  text: `| Check | What it establishes |\n| --- | --- |\n${rows}`,
});

const BOTH = "| `vpn.tunnel` | up |\n| `vpn.unprotected` | contained |\n";

const page = (text: string): Page => ({ path: "src/content/docs/a.md", text });

describe("registered", () => {
  it("reads every identity in the list, families with their dot", () => {
    expect(registered(REGISTERED)).toEqual([
      "credentials.",
      "vpn.leaks.",
      "storage.single-mount",
      "vpn.tunnel",
      "vpn.unprotected",
    ]);
    expect(registered("nothing here")).toEqual([]);
  });

  it("reads the register the pinned core keeps", () => {
    expect(registered(readFileSync(REGISTER, "utf8"))).toContain("vpn.tunnel");
  });
});

describe("checkViolations", () => {
  it("passes checks the register lists, families included", () => {
    expect(
      checkViolations(REGISTERED, [
        VPN(BOTH),
        page(
          "`credentials.sonarr`, `vpn.leaks.one` and `lemonfiber doctor --accept storage.single-mount`, `--only=vpn.tunnel`.",
        ),
      ]),
    ).toEqual([]);
  });

  it("names a check the register does not list, where it stands", () => {
    expect(
      checkViolations(REGISTERED, [
        VPN(BOTH),
        page(
          "Fine.\n\n`lemonfiber doctor --accept vpn.gone`\n\nand `vpn.tunnel-gone`.",
        ),
      ]),
    ).toEqual([
      {
        where: "src/content/docs/a.md",
        line: 3,
        message: `names the check \`vpn.gone\`, which ${REGISTER} does not register`,
      },
      {
        where: "src/content/docs/a.md",
        line: 5,
        message: `names the check \`vpn.tunnel-gone\`, which ${REGISTER} does not register`,
      },
    ]);
  });

  it("leaves file names and other categories alone", () => {
    expect(
      checkViolations(REGISTERED, [
        VPN(BOTH),
        page(
          "`services.txt`, `config.json`, `queue.stuck`, `vpn.gone_x` and `vpn.tunnelling.md`.",
        ),
      ]),
    ).toEqual([]);
  });

  it("holds the VPN page's table to every VPN check the register lists", () => {
    expect(
      checkViolations(REGISTERED, [VPN("| `vpn.tunnel` | up |\n")]),
    ).toEqual([
      {
        where: VPN_PAGE,
        line: null,
        message: `${REGISTER} registers these VPN checks and the page does not set them out: vpn.unprotected`,
      },
    ]);
    expect(checkViolations(REGISTERED, [page("")])).toEqual([
      expect.objectContaining({ where: VPN_PAGE, line: null }),
    ]);
  });

  it("refuses an empty register rather than passing on it", () => {
    expect(checkViolations("", [VPN(BOTH)])).toEqual([
      expect.objectContaining({ where: REGISTER, line: null }),
    ]);
  });
});

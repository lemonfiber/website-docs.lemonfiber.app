import { describe, expect, it } from "vitest";

import {
  columnUnder,
  firstColumnUnder,
  namesUnder,
  tablesUnder,
} from "./tables.ts";

describe("tablesUnder", () => {
  const page = [
    "Some prose.",
    "",
    "| Panel | What it carries |",
    "| ----- | --------------- |",
    "| VPN   | The tunnel      |",
    "| Stuck | What stopped    |",
    "",
    "More prose.",
    "",
    "| Panel  | Also a panel table |",
    "| ------ | ------------------ |",
    "| Alerts | What was raised    |",
    "",
    "| Key | Not a panel table |",
    "| --- | ----------------- |",
    "| q   | Quits             |",
    "",
  ].join("\n");

  it("keeps each table headed the same apart", () => {
    expect(tablesUnder(page, "Panel")).toEqual([["VPN", "Stuck"], ["Alerts"]]);
  });

  it("leaves the tables headed something else alone", () => {
    expect(tablesUnder(page, "Key")).toEqual([["q"]]);
  });

  it("hands a cell on as it was written", () => {
    expect(tablesUnder("| Form |\n| ---- |\n| `tv` |\n", "Form")).toEqual([
      ["`tv`"],
    ]);
  });

  it("reads the backticks off a cell", () => {
    expect(columnUnder("| Form |\n| ---- |\n| `tv` |\n", "Form")).toEqual([
      "tv",
    ]);
  });

  it("reads them off the first table too", () => {
    expect(firstColumnUnder("| Form |\n| ---- |\n| `tv` |\n", "Form")).toEqual([
      "tv",
    ]);
  });

  it("stops at a row it cannot read as a row", () => {
    expect(
      tablesUnder("| Form |\n| ---- |\n| tv\n| `hunt` |\n", "Form"),
    ).toEqual([[]]);
  });

  it("gathers every one of them across the tables", () => {
    expect(columnUnder(page, "Panel")).toEqual(["VPN", "Stuck", "Alerts"]);
  });

  it("takes only the first, where a later table lists something else", () => {
    expect(firstColumnUnder(page, "Panel")).toEqual(["VPN", "Stuck"]);
  });

  it("takes none where there is no such table", () => {
    expect(firstColumnUnder(page, "Nothing")).toEqual([]);
  });
});

describe("namesUnder", () => {
  const page = [
    "| Export                         | What it is for |",
    "| ------------------------------ | -------------- |",
    "| `Client`, `Opened`             | Asking         |",
    "| `Problem`, and `refused` too   | The error      |",
    "",
    "| Kind    | What it carries |",
    "| ------- | --------------- |",
    "| `status` | The stack      |",
  ].join("\n");

  it("names what a row writes as code and not the prose carrying it", () => {
    expect(namesUnder(page, "Export")).toEqual([
      "Client",
      "Opened",
      "Problem",
      "refused",
    ]);
  });

  it("leaves a table headed something else alone", () => {
    expect(namesUnder(page, "Kind")).toEqual(["status"]);
  });

  it("names none where there is no such table", () => {
    expect(namesUnder(page, "Nothing")).toEqual([]);
  });
});

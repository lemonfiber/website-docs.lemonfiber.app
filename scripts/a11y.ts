#!/usr/bin/env node
/** Serves the built site, sweeps it with axe, and stops the server. */
import { spawnSync } from "node:child_process";

const URL_ = "http://127.0.0.1:4321/";

const run = (args: string[]): number =>
  spawnSync("npx", args, { stdio: "inherit" }).status ?? 1;

const reachable = async (): Promise<boolean> => {
  try {
    const response = await fetch(URL_);
    return response.ok;
  } catch {
    return false;
  }
};

run(["astro", "preview", "--port", "4321", "--host", "127.0.0.1"]);

let up = false;
for (let attempt = 0; attempt < 60; attempt++) {
  if (await reachable()) {
    up = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

let status = 1;
if (up) status = run(["playwright", "test"]);
else console.error("a11y: the preview server never answered");

run(["astro", "preview", "stop"]);
process.exit(status);

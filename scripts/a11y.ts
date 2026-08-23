#!/usr/bin/env node
/** Serves the built site, sweeps it with axe, and stops the server. */
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BIN = `${ROOT}node_modules/.bin/`;
const ORIGIN = "http://127.0.0.1:4321/";

const reachable = async (): Promise<boolean> => {
  try {
    const response = await fetch(ORIGIN);
    return response.ok;
  } catch {
    return false;
  }
};

// `astro preview` daemonises on some platforms and stays in the foreground on
// others, so the server is started without waiting on it and stopped both ways.
const server = spawn(
  `${BIN}astro`,
  ["preview", "--port", "4321", "--host", "127.0.0.1"],
  { stdio: "inherit", detached: false },
);

const stop = (): void => {
  server.kill("SIGTERM");
  spawnSync(`${BIN}astro`, ["preview", "stop"], { stdio: "inherit" });
};

let up = false;
for (let attempt = 0; attempt < 120; attempt++) {
  if (await reachable()) {
    up = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

let status = 1;
if (up)
  status =
    spawnSync(`${BIN}playwright`, ["test"], { stdio: "inherit" }).status ?? 1;
else console.error("a11y: the preview server never answered");

stop();
process.exit(status);

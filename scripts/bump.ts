#!/usr/bin/env node
/** Takes every pin that has moved, in the one pull request `bump-pins` keeps. */
import { runBump } from "@lemonfiber/website-kit/run/bump";

runBump({
  root: new URL("..", import.meta.url).pathname,
  guard: [process.execPath, "scripts/guards.ts"],
  citation: "Spec: REPO-R46, Q-R68",
});

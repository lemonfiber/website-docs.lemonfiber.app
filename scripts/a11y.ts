#!/usr/bin/env node
/** Serves the built site, sweeps it with axe, and stops the server. */
import { runA11y } from "@lemonfiber/website-kit/run/a11y";

await runA11y({ root: new URL("..", import.meta.url).pathname });

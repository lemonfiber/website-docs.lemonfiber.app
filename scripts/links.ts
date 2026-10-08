#!/usr/bin/env node
/** Reads the built site and refuses an address into a pinned repository that does not hold. */
import { runLinks } from "@lemonfiber/website-kit/run/links";

await runLinks({ root: new URL("..", import.meta.url).pathname });

#!/usr/bin/env node
/** Fetches the pinned repositories and refuses a pin left behind past its window. */
import { runPins } from "@lemonfiber/website-kit/run/pins";

import { GUARDED } from "../src/lib/guarded.ts";

runPins({ root: new URL("..", import.meta.url).pathname, guarded: GUARDED });

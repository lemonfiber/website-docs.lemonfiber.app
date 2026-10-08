import type { StarlightUserConfig } from "@astrojs/starlight/types";

import * as m from "../paraglide/messages.js";
import type { Topic } from "./topics.ts";

type Sidebar = NonNullable<StarlightUserConfig["sidebar"]>;
type Group = Sidebar[number];

const group = (label: string, directory: string, collapsed = true): Group => ({
  label,
  collapsed,
  items: [{ autogenerate: { directory } }],
});

/**
 * The two topics, each with its own sidebar (REPO-R81). Which section sits under
 * which topic is `TOPICS`; the check in `topics.ts` holds every page to it.
 */
export const topics = [
  {
    id: "use",
    label: m.topic_use(),
    link: "/start/",
    items: [
      group(m.nav_start(), "start", false),
      group(m.nav_running(), "running", false),
      group(m.nav_fixing(), "fixing"),
      group(m.nav_commands(), "commands"),
      group(m.nav_advanced(), "advanced"),
    ],
  },
  {
    id: "build",
    label: m.topic_build(),
    link: "/api/",
    items: [
      group(m.nav_api(), "api", false),
      group(m.nav_plugins(), "plugins"),
    ],
  },
] satisfies { id: Topic; label: string; link: string; items: Sidebar }[];

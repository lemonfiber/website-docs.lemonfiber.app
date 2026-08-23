import type { StarlightUserConfig } from "@astrojs/starlight/types";

import * as m from "../paraglide/messages.js";

type Sidebar = NonNullable<StarlightUserConfig["sidebar"]>;

/** The nine top-level sections, in reading order. */
export const sections: Sidebar = [
  { label: m.nav_start(), items: [{ autogenerate: { directory: "start" } }] },
  {
    label: m.nav_running(),
    items: [{ autogenerate: { directory: "running" } }],
  },
  { label: m.nav_fixing(), items: [{ autogenerate: { directory: "fixing" } }] },
  {
    label: m.nav_commands(),
    items: [{ autogenerate: { directory: "commands" } }],
  },
  { label: m.nav_api(), items: [{ autogenerate: { directory: "api" } }] },
  {
    label: m.nav_advanced(),
    items: [{ autogenerate: { directory: "advanced" } }],
  },
  {
    label: m.nav_contributing(),
    items: [{ autogenerate: { directory: "contributing" } }],
  },
  {
    label: m.nav_building(),
    items: [{ autogenerate: { directory: "develop" } }],
  },
  {
    label: m.nav_project(),
    items: [{ autogenerate: { directory: "project" } }],
  },
];

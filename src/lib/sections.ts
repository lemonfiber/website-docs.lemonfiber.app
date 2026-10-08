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

/** The specification, by the sections it is written in. */
const specification: Group = {
  label: m.nav_spec(),
  collapsed: true,
  items: [
    { label: m.spec_home(), link: "/spec/" },
    group(m.spec_overview(), "spec/00-overview"),
    group(m.spec_features(), "spec/10-functional/features"),
    group(m.spec_journeys(), "spec/10-functional/journeys"),
    group(m.spec_architecture(), "spec/20-architecture"),
    group(m.spec_repos(), "spec/30-repos"),
    group(m.spec_quality(), "spec/40-quality"),
    group(m.spec_governance(), "spec/50-governance"),
    group(m.spec_brand(), "spec/60-brand"),
    group(m.spec_operations(), "spec/70-operations"),
    group(m.spec_appendix(), "spec/90-appendix"),
  ],
};

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
      group(m.nav_project(), "project"),
    ],
  },
  {
    id: "build",
    label: m.topic_build(),
    link: "/api/",
    items: [
      group(m.nav_api(), "api", false),
      group(m.nav_plugins(), "plugins"),
      specification,
    ],
  },
] satisfies { id: Topic; label: string; link: string; items: Sidebar }[];

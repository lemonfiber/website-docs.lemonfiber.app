/** Architecture rules, in the spirit of the Rust workspace's own. */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "A cycle means neither module can be understood on its own.",
      from: {},
      to: { circular: true },
    },
    {
      name: "rules-know-nothing-of-the-filesystem",
      severity: "error",
      comment:
        "src/lib/guards.ts states the rules; scripts/ reads the tree and applies " +
        "them. A dependency the other way makes the rules untestable.",
      from: { path: "^src/lib/guards\\.ts$" },
      to: { path: "^(scripts|node_modules/(node:)?fs)" },
    },
    {
      name: "content-is-not-imported",
      severity: "error",
      comment:
        "Prose is rendered by the content layer, never imported as code.",
      from: { path: "^(src/lib|src/components|scripts)" },
      to: { path: "^src/content/" },
    },
    {
      name: "no-orphans",
      severity: "error",
      comment: "A module nothing imports is either dead or wired up wrong.",
      from: {
        orphan: true,
        pathNot: [
          "\\.d\\.ts$",
          "\\.test\\.ts$",
          "^src/app\\.css$",
          "^src/content\\.config\\.ts$",
          "^scripts/guards\\.ts$",
          "^astro\\.config\\.ts$",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "^(coverage|dist|\\.astro|src/paraglide|vendor)" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "browser"],
      extensions: [".ts", ".js", ".astro"],
    },
  },
};

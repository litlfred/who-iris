/**
 * who-iris's Tool nodes — the `tools` graph for this instance.
 *
 * @module who-iris/tools
 * @graphNode tool
 *
 * ## Why this exists — owner, 2026-10-09
 *
 * > I still want the harness to be where specific visualizers/pages are
 * > declared for the harness at the level … Need harness to declare
 * > visualizer is renderedBy ....
 *
 * who-iris's catalogue page is a visualiser this instance declares in
 * `who-iris.json` `visualisers`, and a visualiser is `renderedBy` a Tool
 * node. The page's generator, `scripts/gen-iris-pages.ts`, had no node — it
 * was named in a test's exception list as "drawn by who-iris's own
 * generator, which declares no tools graph". This is that node: what the
 * generator is, how it is invoked, and which kind it can draw. The
 * declaration says what it DOES draw, and where:
 * `<base>/who-iris/catalogue/`.
 *
 * Discovered like every instance's Tools (`cat-harness/tools/discover.ts`,
 * bean `p0za`): this directory is declared with graph typology `tools`, and
 * nothing imports it by name.
 */
import { defineTool, toolTypeIri, type ToolDefinition } from "../platform.ts";

export function tools(baseUrl?: string): ToolDefinition[] {
  const B = baseUrl ?? "";
  const t = (n: Parameters<typeof toolTypeIri>[1]): string => toolTypeIri(B, n);
  return [
    defineTool({
      id: "iris-pages",
      title: "IRIS replica and catalogue pages",
      description:
        "Render who-iris's replica of the IRIS site, its docs pages, and the catalogue visualiser who-iris declares — what the catalogue knows and what it records that it does not know — at that visualiser's declared route.",
      install: { none: true },
      invoke: { shell: "bun run cat iris:pages" },
      io: {
        inputs: [
          { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if a page is stale, instead of writing." },
        ],
        outputs: [{ name: "pages", schema: t("RepoPath"), description: "The replica under `site/`, the docs under `docs/`, and the catalogue page under the published site directory." }],
      },
      satisfies: ["graph-rendering"],
      renders: ["catalogue"],
      requires: { runtime: ["bun"], network: false },
    }),
  ];
}

import { defineTool, toolFactory } from "../../platform.ts";

export default toolFactory((t) =>
  defineTool({
    id: "iris-pages",
    title: "who-iris catalogue and docs pages",
    description:
      "Render who-iris's docs pages and the catalogue visualiser who-iris declares — what the catalogue knows and what it records that it does not know — at that visualiser's declared route, plus the library's withheld list and the redirects left where the retired IRIS replica was (owner, 2026-10-30).",
    install: { none: true },
    invoke: { shell: "bun run cat iris:pages" },
    io: {
      inputs: [
        { name: "check", schema: t("Flag"), required: false, arg: { flag: "--check" }, description: "Fail if a page is stale, instead of writing." },
      ],
      outputs: [{ name: "pages", schema: t("RepoPath"), description: "The redirects under `site/`, the docs under `docs/`, and the catalogue page under the published site directory." }],
    },
    satisfies: ["graph-rendering"],
    renders: ["catalogue"],
    requires: { runtime: ["bun"], network: false },
  }),
);

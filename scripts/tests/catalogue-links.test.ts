/**
 * Bean `qgjh`: the catalogue page's rows lead somewhere. A collection or item
 * links to the replica page this generator writes for it; a "held as" library
 * id links to the library viewer opened on it. Asserted over the COMMITTED
 * page, since what a reader follows is what was published.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../platform.ts";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = INSTANCE; // the checkout root: who-iris is its own repository, its dependencies mounted inside it
const HARNESS = join(REPO, "cat-harness");
// The harness route `<harness>/<visualiser>/` became `<subject>/<visualiser>/` (cat-harness f999d7f6).
const PAGE = join(HARNESS, siteDirFor(HARNESS), "who-iris", "catalogue", "index.html");
const html = existsSync(PAGE) ? readFileSync(PAGE, "utf-8") : "";
// Matched by TEXT, not by exact markup: the heading carries an id
// (`<h2 id="…">Every node</h2>`), which is not what this test is about.
const table = html.slice(html.search(/<h2\b[^>]*>Every node<\/h2>/));
const nodes = table.slice(0, table.indexOf("</table>"));

describe("the catalogue's rows lead somewhere (qgjh)", () => {
  it("links every replica page it names, and each is a page this repository writes", () => {
    const pages = [...nodes.matchAll(/href="[^"#]*\/((?:item|collection)-[^"]+\.html)"/g)].map((m) => m[1]!);
    // The premise: a table with no links would pass the loop below.
    expect(pages.length).toBeGreaterThan(0);
    // `site/` since bean `2b5s`: the replica left `library/`, which is corpus only.
    for (const p of pages) expect(existsSync(join(INSTANCE, "site", p)), p).toBe(true);
  });

  it("links a held-as library id to the viewer page, which exists", () => {
    const viewers = [...nodes.matchAll(/href="([^"#]*)#[^"]+"><code>/g)].map((m) => m[1]!);
    expect(viewers.length).toBeGreaterThan(0);
    for (const v of new Set(viewers)) {
      expect(existsSync(join(PAGE, "..", v, "index.html")), v).toBe(true);
    }
  });
});

describe("the catalogue viewer is THEMED, so it carries the site's top band (2026-10-07)", () => {
  it("is on the default layout, not a standalone document", () => {
    expect(html.startsWith("---\nlayout: default\n")).toBe(true);
    expect(html).not.toMatch(/<!doctype|<html|<head|<body/i);
    expect(html).toContain('<h1 id="ic-title">');
  });

  it("styles nothing outside its own wrapper, and carries no rail", () => {
    const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]!).join("\n").replace(/\/\*[\s\S]*?\*\//g, "");
    const selectors = [...css.matchAll(/([^{}]+)\{/g)].flatMap((m) => m[1]!.split(",").map((s) => s.trim())).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((s) => !/^(:root\[data-fa-scheme="light"\] )?\.ic-page\b/.test(s))).toEqual([]);
    expect(html).not.toContain('<nav class="fa-nav"');
  });
});

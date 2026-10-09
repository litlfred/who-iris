/**
 * Does the published layout resolve? — the check the repository separation
 * lacked (bean g8jp).
 *
 * GitHub Pages serves this repository's branch ROOT as-is (`.nojekyll`, no
 * build step, no workflow — owner, 2026-10-09: no GitHub Action yet; an agent
 * trigger runs this instead). `index.html` forwards to `site/`, and the
 * replica's relative links (`../library/<slug>-cover.png`, `../dublin-core/…`)
 * resolve against the checkout exactly as they will against
 * `litlfred.github.io/who-iris/`. So every relative link must name a file in
 * the checkout, and every absolute link to this instance's own bytes must name
 * litlfred/who-iris — not the monorepo it left, where those paths now 404.
 *
 *   bun run who-iris/scripts/check-pages-links.ts          # report, exit 1 on a break
 *
 * `KNOWN` lists breaks that are recorded rather than hidden: each needs a fix
 * outside this file, and the check fails if one is fixed and still listed.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");

/** Breaks with a recorded reason, keyed by repo-relative target. */
const KNOWN: Record<string, string> = {
  "id-lookup/index.html":
    "the lookup viewer is cat-harness-tools/id-lookup/index.html, which the monorepo published beside the replica; standalone, it is not published and `?index=who-iris/` names a monorepo route",
};

/** Absolute URLs into a repository this instance no longer lives in. */
const STALE = /(?:raw\.githubusercontent\.com\/litlfred\/folio-assistant\/|cdn\.jsdelivr\.net\/gh\/litlfred\/folio-assistant@|github\.com\/litlfred\/folio-assistant\/(?:tree|blob)\/)[^"']*/g;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? htmlFiles(p) : n.endsWith(".html") ? [p] : [];
  });
}

const pages = [join(ROOT, "index.html"), ...htmlFiles(join(ROOT, "site"))];
const missing = new Map<string, Set<string>>();
const stale: string[] = [];

for (const page of pages) {
  const html = readFileSync(page, "utf-8");
  const from = relative(ROOT, page);
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)/g)) {
    const ref = m[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith("//") || ref.includes("+")) continue;
    let target = normalize(join(dirname(page), decodeURIComponent(ref)));
    if (ref.endsWith("/") || (existsSync(target) && statSync(target).isDirectory())) target = join(target, "index.html");
    if (!existsSync(target)) {
      const key = relative(ROOT, target);
      if (!missing.has(key)) missing.set(key, new Set());
      missing.get(key)!.add(from);
    }
  }
  for (const m of html.matchAll(STALE)) stale.push(`${from}: ${m[0]}`);
}

let failed = false;
for (const [target, from] of missing) {
  if (KNOWN[target]) {
    console.log(`known  ${target} (${from.size} pages) — ${KNOWN[target]}`);
    continue;
  }
  failed = true;
  console.error(`MISSING ${target} — linked from ${[...from].slice(0, 3).join(", ")}${from.size > 3 ? ` and ${from.size - 3} more` : ""}`);
}
for (const k of Object.keys(KNOWN)) {
  if (!missing.has(k)) {
    failed = true;
    console.error(`FIXED BUT STILL LISTED ${k} — remove it from KNOWN`);
  }
}
for (const s of new Set(stale)) {
  failed = true;
  console.error(`STALE  ${s}`);
}
console.log(`${pages.length} pages checked`);
process.exit(failed ? 1 : 0);

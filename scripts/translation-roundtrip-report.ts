#!/usr/bin/env bun
/**
 * The untainted round-trip translation check over who-iris's own catalogues,
 * as a `qa-results/v1` report. Bean `folio-assistant-ktt2` (folio-assistant-core).
 *
 * @module who-iris/scripts/translation-roundtrip-report
 *
 * ```sh
 * bun run who-iris/scripts/translation-roundtrip-report.ts          # write the report
 * bun run who-iris/scripts/translation-roundtrip-report.ts --check  # exit 1 if it is stale
 * ```
 *
 * ## What was measured, and by whom
 *
 * For each target locale, the strings of `site/iris-site.po` and
 * `glossary/who-iris--who-terms.po` were checked by TWO agents kept apart
 * (the `untainted-verification` skill):
 *
 * | agent | saw | wrote |
 * |---|---|---|
 * | back-translator | the `msgstr` values only, by index | `agents/back-translation-<locale>.tsv` |
 * | adjudicator | the English `msgid`, its translator note, and the back-translation, never the `msgstr` | `agents/adjudication-<locale>.tsv` |
 *
 * Each back-translator was limited to one Read (its input) and one Write (its
 * output), and reported `TOOLS_USED: Read,Write` in its file. So it could not
 * look up the English. The earlier check of the same catalogues (bean
 * `folio-assistant-lffo`, 580/580 PASS) was done by the translating agent
 * itself, in one context, and says so. This one is the independent check that
 * one could not be.
 *
 * ## What this script does, and does not do
 *
 * It does not call a model. It joins the committed agent outputs to the
 * catalogues as they are NOW, by index in file order. It records each
 * catalogue's SHA-256, so the report reads as stale the moment a catalogue
 * changes. A flagged string is not corrected here: which reading is right is
 * a reviewer's call (`ingest-l1-completeness-gate.bpmn`, `Task_FlagDrift`).
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const INSTANCE = join(import.meta.dir, "..");
const OUT_DIR = join(INSTANCE, "test", "results", "translation-roundtrip");
const OUT = join(OUT_DIR, "iris-catalogues.qa-results.json");
const LOCALES = ["ar", "es", "fr", "ru", "zh"] as const;
/** In the order the agents saw them: every site string, then the glossary terms. */
const CATALOGUES = ["site/iris-site.po", "glossary/who-iris--who-terms.po"] as const;
const RUN_DATE = "2026-10-10";
const SESSION = "https://claude.ai/code/session_018NFVUeJjQJdrEU32AS1Mco";

export interface PoString {
  catalogue: string;
  msgid: string;
  msgstr: string;
}

/** The non-header entries of a PO file, in file order. Handles continuation lines. */
export function parsePo(text: string, catalogue: string): PoString[] {
  const out: PoString[] = [];
  let cur: Record<string, string> = {};
  let key: string | null = null;
  const flush = () => {
    if (cur.msgid) out.push({ catalogue, msgid: cur.msgid, msgstr: cur.msgstr ?? "" });
    cur = {};
    key = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (line === "") { flush(); continue; }
    if (line.startsWith("#")) { if (cur.msgstr !== undefined) flush(); continue; }
    const m = /^(msgctxt|msgid|msgstr)\s+(".*")$/.exec(line);
    if (m) { key = m[1]!; cur[key] = JSON.parse(m[2]!) as string; continue; }
    if (line.startsWith('"') && key) cur[key] += JSON.parse(line) as string;
  }
  flush();
  return out;
}

/** `<index>\t<payload>` lines, plus the trailing named lines (TOOLS_USED, UNCERTAIN, SUMMARY). */
export function parseTsv(text: string): { rows: Map<number, string[]>; named: Map<string, string> } {
  const rows = new Map<number, string[]>();
  const named = new Map<string, string>();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const [k, ...rest] = line.split("\t");
    if (/^\d+$/.test(k!)) rows.set(Number(k), rest);
    else named.set(k!, rest.join("\t"));
  }
  return { rows, named };
}

type Verdict = "pass" | "warn" | "fail";

export function buildReport(instance = INSTANCE): Record<string, unknown> {
  const script = readFileSync(join(import.meta.dir, "translation-roundtrip-report.ts"), "utf-8");
  const families: Record<string, { summary: string; count: number; entries: unknown[] }> = {};
  const totals: Record<string, Record<Verdict, number>> = {};
  const catalogues: Record<string, string> = {};
  for (const locale of LOCALES) {
    const strings: PoString[] = [];
    for (const cat of CATALOGUES) {
      const path = join(instance, "translations", locale, cat);
      const text = readFileSync(path, "utf-8");
      catalogues[relative(instance, path)] = createHash("sha256").update(text).digest("hex");
      strings.push(...parsePo(text, cat));
    }
    const agents = join(instance, "test", "results", "translation-roundtrip", "agents");
    const bt = parseTsv(readFileSync(join(agents, `back-translation-${locale}.tsv`), "utf-8"));
    const adj = parseTsv(readFileSync(join(agents, `adjudication-${locale}.tsv`), "utf-8"));
    if (bt.rows.size !== strings.length || adj.rows.size !== strings.length) {
      throw new Error(`${locale}: ${strings.length} strings, ${bt.rows.size} back-translations, ${adj.rows.size} rulings — the catalogue changed since the run; re-run the agents`);
    }
    const count: Record<Verdict, number> = { pass: 0, warn: 0, fail: 0 };
    const flagged: unknown[] = [];
    strings.forEach((s, i) => {
      const [verdict, severity, findings] = adj.rows.get(i)! as [Verdict, string, string];
      count[verdict]++;
      if (verdict !== "pass") {
        const f = JSON.parse(findings || "[]") as string[];
        flagged.push({
          index: i,
          catalogue: s.catalogue,
          msgid: s.msgid,
          msgstr: s.msgstr,
          back_translation: JSON.parse(bt.rows.get(i)![0]!) as string,
          verdict,
          severity: severity === "-" ? undefined : severity,
          drift: f.some((x) => x.startsWith("[term]")) ? "terminology" : "semantic",
          findings: f,
        });
      }
    });
    totals[locale] = count;
    families[`roundtrip-${locale}`] = {
      summary:
        `${locale}: ${count.pass} pass, ${count.warn} warn, ${count.fail} fail of ${strings.length}. ` +
        `Back-translator tools: ${bt.named.get("TOOLS_USED") ?? "not recorded"}. Each entry awaits a reviewer's ruling; nothing was auto-corrected.`,
      count: flagged.length,
      entries: flagged,
    };
  }
  return {
    $schema: "qa-results/v1",
    producer: {
      script: "who-iris/scripts/translation-roundtrip-report.ts",
      script_hash: createHash("sha256").update(script).digest("hex").slice(0, 12),
    },
    subject: { kind: "translation-catalogues", id: "who-iris" },
    criterion: "translation-semantic-roundtrip",
    method: {
      skill: "untainted-verification",
      run: RUN_DATE,
      session: SESSION,
      back_translator: "roundtrip-back-translator: saw msgstr only; one Read, one Write",
      adjudicator: "roundtrip-adjudicator: saw msgid, translator note and back-translation; never msgstr",
      model: "not recorded",
      supersedes_note: "folio-assistant-lffo's 580/580 was self-checked by the translating agent; this run is independent",
    },
    catalogues,
    totals,
    families,
    total: Object.values(families).reduce((n, f) => n + f.count, 0),
  };
}

if (import.meta.main) {
  const json = JSON.stringify(buildReport(), null, 2) + "\n";
  if (process.argv.includes("--check")) {
    const have = (() => { try { return readFileSync(OUT, "utf-8"); } catch { return ""; } })();
    if (have !== json) {
      console.error(`stale: ${relative(INSTANCE, OUT)} — run without --check`);
      process.exit(1);
    }
    console.log(`current: ${relative(INSTANCE, OUT)}`);
  } else {
    writeFileSync(OUT, json);
    console.log(`wrote ${relative(dirname(INSTANCE), OUT)}`);
  }
}

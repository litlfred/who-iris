/**
 * The untainted round-trip report (bean folio-assistant-ktt2) is derived from
 * the committed agent outputs and the catalogues as they are now. These tests
 * keep it so: the committed report is current, and the joins it relies on hold.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildReport, parsePo, parseTsv } from "../translation-roundtrip-report.ts";

const REPORT = join(import.meta.dir, "..", "..", "test", "results", "translation-roundtrip", "iris-catalogues.qa-results.json");

describe("translation round-trip report", () => {
  test("the committed report is what the agents' outputs and today's catalogues give", () => {
    expect(JSON.parse(readFileSync(REPORT, "utf-8"))).toEqual(buildReport());
  });

  test("every back-translator reports Read and Write only", () => {
    for (const [locale, f] of Object.entries(buildReport().families as Record<string, { summary: string }>)) {
      expect(f.summary, locale).toContain("Back-translator tools: Read,Write.");
    }
  });

  test("parsePo joins continuation lines and skips the header", () => {
    const po = 'msgid ""\nmsgstr ""\n"Language: fr\\n"\n\n#. note\nmsgid "a "\n"b"\nmsgstr "c"\n';
    expect(parsePo(po, "x.po")).toEqual([{ catalogue: "x.po", msgid: "a b", msgstr: "c" }]);
  });

  test("parseTsv separates index rows from the named trailer lines", () => {
    const t = parseTsv('0\t"one"\n1\t"two"\nTOOLS_USED\tRead,Write\n');
    expect([...t.rows.keys()]).toEqual([0, 1]);
    expect(t.named.get("TOOLS_USED")).toBe("Read,Write");
  });
});

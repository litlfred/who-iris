/**
 * The IRIS CDN Exporter's runner — what `.github/workflows/iris-cdn.yml`
 * calls. One mode per process in `processes/`:
 *
 *   bun scripts/iris-cdn/run.ts nightly   --release <dir>
 *   bun scripts/iris-cdn/run.ts reconcile --release <dir>
 *
 * `<dir>` is a checkout of the release-history git repository on Cloudflare
 * Artifacts. This script only writes files into it; the workflow commits and
 * pushes, so a failed run leaves the remote untouched.
 *
 * Bytes go to R2 under `sha256/<aa>/<digest>`, and only when that key is not
 * already there (the no-churn rule). The BagIt payload manifest maps each
 * logical path (`records/<handle>.json`, `bitstreams/<item>/<name>`) to its
 * digest, so the manifest in git is the index of what R2 holds.
 *
 * NOT BUILT YET, and said so rather than faked:
 *  - `initial-load` (needs the owner's budget, Task_StateBudget);
 *  - the graph rebuild (Call_Rebuild): `build-iris-oxigraph.ts` reads this
 *    repository's catalogue, not the exported records, and has to be pointed
 *    at them;
 *  - the IRIS REST shapes are unconfirmed against the live API.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash, type webcrypto } from "node:crypto";
import { join } from "node:path";
import { S3Client } from "bun";
import { diffManifests, isEmptyDiff, itemManifest, itemManifestPath, parsePayloadManifest, sha256Hex, tagFiles, type PayloadEntry } from "./bag.ts";
import { didWebUrl, importPrivateJwk, signDetached, verifyDetached, type DidDocument } from "./signing.ts";
import { allContainers, allItems, bitstreamContentUrl, changedSince, IRIS_API, itemBitstreams, metadataSha, withdrawnOrHidden, type Fetcher } from "./rest-feed.ts";

const USER_AGENT = "who-iris-cdn-exporter (+https://github.com/litlfred/who-iris)";

/** Canonical JSON: keys sorted at every depth, two-space indent, LF, trailing newline. */
export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(sort(value), null, 2) + "\n";
}

/** HAL `_links` carry request-specific URLs; they are not part of the record. */
export function recordOf(item: Record<string, unknown>): Record<string, unknown> {
  const { _links, _embedded, ...rest } = item;
  return rest;
}

const politeFetch: Fetcher = async (url) => {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
    if ((res.status === 429 || res.status === 503) && attempt < 5) {
      await Bun.sleep(2 ** attempt * 1000);
      continue;
    }
    return res;
  }
};

interface Store {
  has(digest: string): Promise<boolean>;
  put(digest: string, bytes: Uint8Array, contentType: string): Promise<void>;
}

const keyOf = (digest: string): string => `sha256/${digest.slice(0, 2)}/${digest}`;

function r2Store(): Store {
  const need = (k: string): string => {
    const v = process.env[k];
    if (!v) throw new Error(`${k} is not set`);
    return v;
  };
  const client = new S3Client({
    accessKeyId: need("R2_ACCESS_KEY_ID"),
    secretAccessKey: need("R2_SECRET_ACCESS_KEY"),
    endpoint: `https://${need("CLOUDFLARE_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    bucket: need("R2_BUCKET"),
  });
  return {
    has: (d) => client.file(keyOf(d)).exists(),
    put: async (d, bytes, type) => {
      await client.write(keyOf(d), bytes, { type });
    },
  };
}

interface State {
  cursor: string;
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf-8")) as T) : fallback;
}

/** The payload manifest of the last published release, as entries. */
function heldEntries(release: string): Map<string, PayloadEntry> {
  const out = new Map<string, PayloadEntry>();
  const sizes = readJson<Record<string, number>>(join(release, "state", "sizes.json"), {});
  const mf = join(release, "manifest-sha256.txt");
  if (!existsSync(mf)) return out;
  for (const [path, sha256] of parsePayloadManifest(readFileSync(mf, "utf-8"))) out.set(path, { path, sha256, bytes: sizes[path] ?? 0 });
  return out;
}

async function storeBytes(store: Store, bytes: Uint8Array, type: string, counts: { stored: number; skipped: number }): Promise<string> {
  const digest = sha256Hex(bytes);
  if (await store.has(digest)) counts.skipped++;
  else {
    await store.put(digest, bytes, type);
    counts.stored++;
  }
  return digest;
}

async function ingestItem(uuid: string, entries: Map<string, PayloadEntry>, store: Store, report: Report): Promise<void> {
  const res = await politeFetch(`${IRIS_API}/core/items/${uuid}`);
  if (!res.ok) throw new Error(`item ${uuid}: HTTP ${res.status}`);
  const item = (await res.json()) as Record<string, unknown>;
  const handle = typeof item.handle === "string" ? item.handle : `uuid/${uuid}`;
  const record = new TextEncoder().encode(canonicalJson(recordOf(item)));
  const path = `records/${handle}.json`;
  report.uuids[uuid] = path;
  report.touched.add(handle);
  report.metadataSha[uuid] = metadataSha(item.metadata);
  entries.set(path, { path, sha256: await storeBytes(store, record, "application/json", report.objects), bytes: record.byteLength });

  for (const bs of await itemBitstreams(politeFetch, uuid)) {
    const bpath = `bitstreams/${handle}/${bs.bundle}/${bs.name}`;
    const held = entries.get(bpath);
    if (held && report.md5[bpath] === bs.checkSum.value) continue; // unchanged upstream: not fetched again
    const r = await fetch(bitstreamContentUrl(bs.uuid), { headers: { "User-Agent": USER_AGENT } });
    if (!r.ok) throw new Error(`bitstream ${bs.uuid}: HTTP ${r.status}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bs.checkSum.checkSumAlgorithm === "MD5" && createHash("md5").update(bytes).digest("hex") !== bs.checkSum.value) {
      report.quarantined.push(bpath);
      continue;
    }
    entries.set(bpath, { path: bpath, sha256: await storeBytes(store, bytes, r.headers.get("content-type") ?? "application/octet-stream", report.objects), bytes: bytes.byteLength });
    report.md5[bpath] = bs.checkSum.value;
  }
}

/** Communities and collections, re-read in full; unchanged ones write nothing new. */
async function ingestContainers(entries: Map<string, PayloadEntry>, store: Store, report: Report): Promise<void> {
  for (const kind of ["communities", "collections"] as const) {
    for (const obj of await allContainers(politeFetch, kind)) {
      const handle = typeof obj.handle === "string" ? obj.handle : `uuid/${String(obj.uuid)}`;
      const bytes = new TextEncoder().encode(canonicalJson(recordOf(obj)));
      const path = `records/${kind}/${handle}.json`;
      const digest = await storeBytes(store, bytes, "application/json", report.objects);
      if (entries.get(path)?.sha256 !== digest) report.containersChanged++;
      entries.set(path, { path, sha256: digest, bytes: bytes.byteLength });
    }
  }
}

interface Report {
  mode: string;
  changedItems: number;
  objects: { stored: number; skipped: number };
  quarantined: string[];
  withdrawn: string[];
  md5: Record<string, string>;
  /** item uuid → its record path; the weekly listing is by uuid. */
  uuids: Record<string, string>;
  /** item uuid → hash of its metadata as last ingested (the weekly check). */
  metadataSha: Record<string, string>;
  containersChanged: number;
  /** handles of items ingested this run; only these can need a new item signature. */
  touched: Set<string>;
  itemsSigned: number;
}

let signer: { key: webcrypto.CryptoKey; kid: string } | null = null;
async function getSigner(): Promise<{ key: webcrypto.CryptoKey; kid: string }> {
  if (signer) return signer;
  const did = process.env.IRIS_CDN_DID;
  const jwk = process.env.IRIS_CDN_SIGNING_JWK;
  if (!did || !jwk) throw new Error("IRIS_CDN_DID and IRIS_CDN_SIGNING_JWK must be set to sign");
  signer = { key: await importPrivateJwk(JSON.parse(jwk)), kid: `${did}#${process.env.IRIS_CDN_KEY_ID ?? "release-1"}` };
  return signer;
}

/**
 * A detached JWS on each touched library item's own manifest. An item whose
 * manifest bytes did not change keeps its existing signature: ES256 is
 * randomised, so re-signing would change bytes for nothing.
 */
async function signItems(entries: Map<string, PayloadEntry>, store: Store, report: Report): Promise<void> {
  for (const handle of [...report.touched].sort()) {
    const text = itemManifest(handle, entries.values());
    const mpath = itemManifestPath(handle);
    const bytes = new TextEncoder().encode(text);
    if (entries.get(mpath)?.sha256 === sha256Hex(bytes) && entries.has(`${mpath}.jws`)) continue;
    const { key, kid } = await getSigner();
    const jws = new TextEncoder().encode((await signDetached(text, key, kid)) + "\n");
    entries.set(mpath, { path: mpath, sha256: await storeBytes(store, bytes, "text/plain", report.objects), bytes: bytes.byteLength });
    entries.set(`${mpath}.jws`, { path: `${mpath}.jws`, sha256: await storeBytes(store, jws, "application/jose", report.objects), bytes: jws.byteLength });
    report.itemsSigned++;
  }
}

/** Sign changed items, write the bag, and sign the release only if the payload changed. */
async function publish(release: string, previous: Map<string, PayloadEntry>, next: Map<string, PayloadEntry>, store: Store, report: Report): Promise<boolean> {
  await signItems(next, store, report);
  const prevMap = new Map([...previous].map(([p, e]) => [p, e.sha256]));
  const nextMap = new Map([...next].map(([p, e]) => [p, e.sha256]));
  const diff = diffManifests(prevMap, nextMap);
  console.log(JSON.stringify({ added: diff.added.length, changed: diff.changed.length, removed: diff.removed.length, unchanged: diff.unchanged }));
  if (isEmptyDiff(diff)) return false;
  const tags = tagFiles([...next.values()], { "Source-Organization": "WHO IRIS (ingested copy)", "External-Identifier": "https://iris.who.int" });
  for (const [name, text] of Object.entries(tags)) writeFileSync(join(release, name), text);
  const { key, kid } = await getSigner();
  writeFileSync(join(release, "tagmanifest-sha256.txt.jws"), (await signDetached(tags["tagmanifest-sha256.txt"], key, kid)) + "\n");
  mkdirSync(join(release, "state"), { recursive: true });
  writeFileSync(join(release, "state", "sizes.json"), canonicalJson(Object.fromEntries([...next].map(([p, e]) => [p, e.bytes]))));
  return true;
}

/**
 * Task_Verify: check the tag files against the tag manifest, then the
 * signature against the key resolved from did:web — never from the package.
 * Exits non-zero on `failed` and on `unknown`, so the workflow does not
 * treat an unverifiable release as published.
 */
async function verify(release: string): Promise<void> {
  const tm = readFileSync(join(release, "tagmanifest-sha256.txt"), "utf-8");
  for (const [name, digest] of tm.split("\n").filter(Boolean).map((l) => l.split(/\s+/) as [string, string]).map(([d, n]) => [n, d])) {
    if (sha256Hex(readFileSync(join(release, name))) !== digest) throw new Error(`tag file ${name} does not match the tag manifest`);
  }
  const jws = readFileSync(join(release, "tagmanifest-sha256.txt.jws"), "utf-8").trim();
  const kid = JSON.parse(Buffer.from(jws.split(".")[0], "base64url").toString()).kid as string;
  const did = kid.split("#")[0];
  let doc: DidDocument | null = null;
  try {
    const res = await fetch(didWebUrl(did), { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) doc = (await res.json()) as DidDocument;
  } catch {
    doc = null;
  }
  // WHO's signing key (public JWK), so the x5c chain is checked, not just present.
  const anchor = process.env.IRIS_CDN_TRUST_ANCHOR_JWK;
  const verdict = await verifyDetached(tm, jws, doc, anchor ? { anchors: [JSON.parse(anchor)] } : {});
  console.log(JSON.stringify(verdict));
  if (verdict.state !== "verified") process.exit(1);
}

async function main(): Promise<void> {
  const [mode, ...rest] = process.argv.slice(2);
  const release = rest[rest.indexOf("--release") + 1];
  if (!release || !existsSync(release)) throw new Error("--release <checkout of the Cloudflare git repository> is required");
  if (mode === "verify") return verify(release);
  const statePath = join(release, "state", "cursor.json");
  const md5Path = join(release, "state", "md5.json");
  const uuidsPath = join(release, "state", "uuids.json");
  const withdrawnPath = join(release, "state", "withdrawn.json");
  const metaPath = join(release, "state", "metadata-sha.json");
  const store = r2Store();
  const previous = heldEntries(release);
  const next = new Map(previous);
  const report: Report = { mode, changedItems: 0, objects: { stored: 0, skipped: 0 }, quarantined: [], withdrawn: [], md5: readJson(md5Path, {}), uuids: readJson(uuidsPath, {}), metadataSha: readJson(metaPath, {}), containersChanged: 0, touched: new Set(), itemsSigned: 0 };
  const saveState = (): void => {
    mkdirSync(join(release, "state"), { recursive: true });
    writeFileSync(md5Path, canonicalJson(report.md5));
    writeFileSync(uuidsPath, canonicalJson(report.uuids));
    writeFileSync(metaPath, canonicalJson(report.metadataSha));
  };

  if (mode === "nightly") {
    const state = readJson<State>(statePath, { cursor: "" });
    if (!state.cursor) throw new Error("no cursor: run the initial load first");
    const changed = await changedSince(politeFetch, state.cursor);
    report.changedItems = changed.length;
    for (const it of changed) await ingestItem(it.uuid, next, store, report);
    await ingestContainers(next, store, report);
    const changedAnything = await publish(release, previous, next, store, report);
    if (changed.length > 0) state.cursor = changed[changed.length - 1].lastModified;
    if (changedAnything || changed.length > 0) {
      saveState();
      writeFileSync(statePath, canonicalJson(state));
    }
  } else if (mode === "reconcile") {
    const listing = await allItems(politeFetch);
    const listed = new Set(listing.keys());
    // Throws above the 1% guard: a short listing is not a mass withdrawal.
    const missing = withdrawnOrHidden(Object.keys(report.uuids), listed);
    // Metadata edited without moving lastModified: re-ingest exactly those.
    for (const [uuid, sha] of listing) {
      if (sha !== null && report.uuids[uuid] && report.metadataSha[uuid] !== sha) await ingestItem(uuid, next, store, report);
    }
    await ingestContainers(next, store, report);
    const withdrawn = readJson<Record<string, string>>(withdrawnPath, {});
    for (const uuid of missing) {
      const res = await politeFetch(`${IRIS_API}/core/items/${uuid}`);
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        withdrawn[uuid] = res.status === 404 ? "gone" : "private";
        report.withdrawn.push(uuid);
      } else if (res.ok) {
        await ingestItem(uuid, next, store, report); // the record carries `withdrawn: true` itself
        if (((await res.json()) as { withdrawn?: boolean }).withdrawn) report.withdrawn.push(uuid);
      } else throw new Error(`re-check ${uuid}: HTTP ${res.status}`);
    }
    // Withdrawn items keep their record and bytes in the manifest: a citation may point at them.
    if (report.withdrawn.length > 0) writeFileSync(withdrawnPath, canonicalJson(withdrawn));
    if ((await publish(release, previous, next, store, report)) || report.withdrawn.length > 0) saveState();
  } else {
    throw new Error(`mode ${mode}: not built yet (see the header of this file)`);
  }
  const { md5: _md5, uuids: _u, metadataSha: _m, touched: _t, ...summary } = report;
  console.log(canonicalJson(summary));
}

if (import.meta.main) await main();

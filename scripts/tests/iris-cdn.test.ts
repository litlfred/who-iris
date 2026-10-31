import { describe, expect, test } from "bun:test";
import { diffManifests, isEmptyDiff, parsePayloadManifest, payloadManifest, sha256Hex, tagFiles, type PayloadEntry } from "../iris-cdn/bag.ts";
import { didDocument, didWebUrl, generateKeyPair, signDetached, verifyDetached, type PublicJwk } from "../iris-cdn/signing.ts";
import { mkdtempSync, readFileSync as readFile } from "node:fs";
import { tmpdir } from "node:os";
import { join as pjoin } from "node:path";
import { createPrivateKey, webcrypto } from "node:crypto";
import { allItemIds, changedSince, itemBitstreams, withdrawnOrHidden, type Fetcher } from "../iris-cdn/rest-feed.ts";

const e = (path: string, body: string): PayloadEntry => ({ path, sha256: sha256Hex(body), bytes: Buffer.byteLength(body) });

describe("BagIt manifests (RFC 8493) — no churn", () => {
  const a = [e("graph/spine.nq", "s"), e("records/10665/1.json", "one"), e("bitstreams/ab.pdf", "pdf")];

  test("order of discovery does not change the bytes", () => {
    expect(tagFiles(a)).toEqual(tagFiles([...a].reverse()));
  });

  test("no Bagging-Date, and a date label is refused", () => {
    expect(tagFiles(a)["bag-info.txt"]).not.toMatch(/Date/);
    expect(() => tagFiles(a, { "Bagging-Date": "2026-10-30" })).toThrow(/date/);
  });

  test("Payload-Oxum is octets.count", () => {
    expect(tagFiles(a)["bag-info.txt"]).toContain("Payload-Oxum: 7.3\n");
  });

  test("manifest round-trips and diffs to exactly what moved", () => {
    const prev = parsePayloadManifest(payloadManifest(a));
    const next = parsePayloadManifest(payloadManifest([e("graph/spine.nq", "s2"), e("records/10665/1.json", "one"), e("records/10665/2.json", "two")]));
    const d = diffManifests(prev, next);
    expect(d).toEqual({ added: ["records/10665/2.json"], changed: ["graph/spine.nq"], removed: ["bitstreams/ab.pdf"], unchanged: 1 });
    expect(isEmptyDiff(diffManifests(prev, prev))).toBe(true);
  });

  test("unsafe and duplicate paths are refused", () => {
    expect(() => payloadManifest([e("../x", "x")])).toThrow(/unsafe/);
    expect(() => payloadManifest([e("x", "1"), e("x", "2")])).toThrow(/duplicate/);
  });
});

describe("did:web + detached JWS (RFC 7515 App. F, ES256 / EdDSA)", () => {
  test("did:web resolution", () => {
    expect(didWebUrl("did:web:litlfred.github.io:who-iris-cdn")).toBe("https://litlfred.github.io/who-iris-cdn/did.json");
    expect(didWebUrl("did:web:example.org")).toBe("https://example.org/.well-known/did.json");
    expect(didWebUrl("did:web:localhost%3A8443:a")).toBe("https://localhost:8443/a/did.json");
  });

  test("sign, verify, and every way it should fail", async () => {
    const did = "did:web:litlfred.github.io:who-iris-cdn";
    const { privateKey, publicJwk } = await generateKeyPair();
    const other = await generateKeyPair();
    const doc = didDocument(did, [{ fragment: "release-2026", jwk: publicJwk, active: true }, { fragment: "old", jwk: other.publicJwk, active: false }]);
    const payload = tagFiles([e("a", "a")])["tagmanifest-sha256.txt"];
    const jws = await signDetached(payload, privateKey, `${did}#release-2026`);
    expect(jws.split(".")[1]).toBe("");

    expect(JSON.parse(Buffer.from(jws.split(".")[0], "base64url").toString()).alg).toBe("ES256");
    expect(await verifyDetached(payload, jws, doc)).toEqual({ state: "verified", kid: `${did}#release-2026`, chain: "absent" });
    expect((await verifyDetached(payload + "x", jws, doc)).state).toBe("failed");
    expect((await verifyDetached(payload, jws, null)).state).toBe("unknown");

    const byRetired = await signDetached(payload, other.privateKey, `${did}#old`);
    expect(await verifyDetached(payload, byRetired, doc)).toMatchObject({ state: "failed", reason: expect.stringContaining("assertionMethod") });
  });

  test("the DID document is byte-stable for the same keys", async () => {
    const k1 = await generateKeyPair();
    const k2 = await generateKeyPair();
    const did = "did:web:example.org";
    const x = didDocument(did, [{ fragment: "b", jwk: k2.publicJwk, active: true }, { fragment: "a", jwk: k1.publicJwk, active: true }]);
    const y = didDocument(did, [{ fragment: "a", jwk: k1.publicJwk, active: true }, { fragment: "b", jwk: k2.publicJwk, active: true }]);
    expect(JSON.stringify(x)).toBe(JSON.stringify(y));
    expect(x.verificationMethod[0].type).toBe("JsonWebKey");
  });
});

describe("DSpace REST change feed", () => {
  const items = [
    { uuid: "u5", handle: "10665/5", lastModified: "2026-10-30T01:00:00Z" },
    { uuid: "u4", handle: "10665/4", lastModified: "2026-10-29T23:00:00Z" },
    { uuid: "u3", handle: "10665/3", lastModified: "2026-10-29T00:00:00Z" },
    { uuid: "u2", handle: "10665/2", lastModified: "2026-10-28T00:00:00Z" },
    { uuid: "u1", handle: "10665/1", lastModified: "2026-10-01T00:00:00Z", withdrawn: true },
  ];
  const fake = (size: number): { fetcher: Fetcher; calls: string[] } => {
    const calls: string[] = [];
    const fetcher: Fetcher = async (url) => {
      calls.push(url);
      const page = Number(new URL(url).searchParams.get("page"));
      const slice = items.slice(page * size, page * size + size);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          _embedded: {
            searchResult: {
              _embedded: { objects: slice.map((it) => ({ _embedded: { indexableObject: { type: "item", ...it } } })) },
              page: { number: page, totalPages: Math.ceil(items.length / size) },
            },
          },
        }),
      };
    };
    return { fetcher, calls };
  };

  test("pages newest first and stops at the cursor; returns oldest first", async () => {
    const { fetcher, calls } = fake(2);
    const got = await changedSince(fetcher, "2026-10-29T00:00:00Z", { api: "https://x/api" });
    expect(got.map((i) => i.uuid)).toEqual(["u3", "u4", "u5"]);
    expect(calls.length).toBe(2);
    expect(calls[0]).toContain("sort=lastModified,DESC");
  });

  test("weekly reconciliation lists everything", async () => {
    const { fetcher } = fake(2);
    expect([...(await allItemIds(fetcher, { api: "https://x/api" }))].sort()).toEqual(["u1", "u2", "u3", "u4", "u5"]);
  });

  test("a short listing is not read as a mass withdrawal", () => {
    expect(withdrawnOrHidden(["a", "b"], new Set(["a"]), 0.5)).toEqual(["b"]);
    expect(() => withdrawnOrHidden(["a", "b", "c"], new Set(["a"]), 0.5)).toThrow(/faulty/);
  });

  test("bitstreams come out of embedded bundles, sorted, with their bundle", async () => {
    const fetcher: Fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        _embedded: {
          bundles: {
            _embedded: {
              bundles: [
                { name: "THUMBNAIL", _embedded: { bitstreams: { _embedded: { bitstreams: [{ uuid: "t", name: "c.jpg", sizeBytes: 9, checkSum: { checkSumAlgorithm: "MD5", value: "x" } }] } } } },
                { name: "ORIGINAL", _embedded: { bitstreams: { _embedded: { bitstreams: [{ uuid: "o", name: "c.pdf", sizeBytes: 99, checkSum: { checkSumAlgorithm: "MD5", value: "y" } }] } } } },
              ],
            },
          },
        },
      }),
    });
    expect((await itemBitstreams(fetcher, "u1", "https://x/api")).map((b) => `${b.bundle}/${b.name}`)).toEqual(["ORIGINAL/c.pdf", "THUMBNAIL/c.jpg"]);
  });
});

describe("canonical records — no churn", () => {
  test("key order and HAL links do not change the bytes", async () => {
    const { canonicalJson, recordOf } = await import("../iris-cdn/run.ts");
    const a = recordOf({ uuid: "u", handle: "10665/1", metadata: { "dc.title": [{ value: "T" }], "dc.date": [] }, _links: { self: { href: "https://x/1" } } });
    const b = recordOf({ _links: { self: { href: "https://y/1" } }, metadata: { "dc.date": [], "dc.title": [{ value: "T" }] }, handle: "10665/1", uuid: "u" });
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(canonicalJson(a).endsWith("}\n")).toBe(true);
  });
});

describe("metadata can change while the PDF does not", () => {
  test("metadataSha ignores key order and sees a value change", async () => {
    const { metadataSha } = await import("../iris-cdn/rest-feed.ts");
    const a = metadataSha({ "dc.title": [{ value: "T", language: "en" }], "dc.date.issued": [{ value: "2020" }] });
    const b = metadataSha({ "dc.date.issued": [{ value: "2020" }], "dc.title": [{ language: "en", value: "T" }] });
    const c = metadataSha({ "dc.date.issued": [{ value: "2021" }], "dc.title": [{ language: "en", value: "T" }] });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test("the weekly listing carries each item's metadata hash", async () => {
    const { allItems, metadataSha } = await import("../iris-cdn/rest-feed.ts");
    const md = { "dc.title": [{ value: "X" }] };
    const fetcher: Fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        _embedded: { searchResult: { _embedded: { objects: [{ _embedded: { indexableObject: { uuid: "u", lastModified: "2026-10-30T00:00:00Z", metadata: md } } }] }, page: { number: 0, totalPages: 1 } } },
      }),
    });
    expect((await allItems(fetcher, { api: "https://x/api" })).get("u")).toBe(metadataSha(md));
  });

  test("communities and collections are paged in full", async () => {
    const { allContainers } = await import("../iris-cdn/rest-feed.ts");
    const all = Array.from({ length: 5 }, (_, i) => ({ uuid: `c${i}`, handle: `10665/c${i}`, name: `C${i}` }));
    const fetcher: Fetcher = async (url) => {
      const page = Number(new URL(url).searchParams.get("page"));
      return { ok: true, status: 200, json: async () => ({ _embedded: { collections: all.slice(page * 2, page * 2 + 2) }, page: { number: page, totalPages: 3 } }) };
    };
    expect((await allContainers(fetcher, "collections", { api: "https://x/api", size: 2 })).map((c) => c.uuid)).toEqual(["c0", "c1", "c2", "c3", "c4"]);
  });
});

describe("x5c trust chain up to WHO's key", () => {
  const sh = (args: string[], cwd: string): void => {
    const r = Bun.spawnSync(["openssl", ...args], { cwd, stderr: "pipe" });
    if (r.exitCode !== 0) throw new Error(`openssl ${args.join(" ")}: ${r.stderr.toString()}`);
  };
  const der64 = (pem: string): string => pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const pubJwk = (pem: string): PublicJwk => {
    const j = createPrivateKey(pem).export({ format: "jwk" }) as { x: string; y: string };
    return { kty: "EC", crv: "P-256", x: j.x, y: j.y };
  };

  test("leaf signed by the WHO anchor verifies; a stranger's chain fails", async () => {
    const d = mkdtempSync(pjoin(tmpdir(), "x5c-"));
    for (const n of ["who", "iris", "other"]) sh(["ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", `${n}.key`], d);
    sh(["req", "-x509", "-new", "-key", "who.key", "-subj", "/CN=WHO test root", "-days", "30", "-addext", "basicConstraints=critical,CA:TRUE", "-out", "who.crt"], d);
    sh(["req", "-new", "-key", "iris.key", "-subj", "/CN=IRIS CDN", "-out", "iris.csr"], d);
    sh(["x509", "-req", "-in", "iris.csr", "-CA", "who.crt", "-CAkey", "who.key", "-CAcreateserial", "-days", "30", "-out", "iris.crt"], d);
    const irisPem = readFile(pjoin(d, "iris.key"), "utf-8");
    const leaf = der64(readFile(pjoin(d, "iris.crt"), "utf-8"));
    const whoJwk = pubJwk(readFile(pjoin(d, "who.key"), "utf-8"));
    const otherJwk = pubJwk(readFile(pjoin(d, "other.key"), "utf-8"));
    const irisJwk = { ...pubJwk(irisPem), x5c: [leaf] } as PublicJwk;

    const pk8 = createPrivateKey(irisPem).export({ format: "der", type: "pkcs8" });
    const key = await webcrypto.subtle.importKey("pkcs8", pk8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
    const did = "did:web:example.org";
    const doc = didDocument(did, [{ fragment: "iris", jwk: irisJwk, active: true }]);
    const jws = await signDetached("payload", key, `${did}#iris`);

    expect(await verifyDetached("payload", jws, doc, { anchors: [whoJwk] })).toMatchObject({ state: "verified", chain: "verified" });
    expect(await verifyDetached("payload", jws, doc)).toMatchObject({ state: "verified", chain: "not-checked" });
    expect(await verifyDetached("payload", jws, doc, { anchors: [otherJwk] })).toMatchObject({ state: "failed", reason: expect.stringContaining("trust anchor") });
    expect(await verifyDetached("payload", jws, doc, { anchors: [whoJwk], at: new Date("2099-01-01") })).toMatchObject({ state: "failed", reason: expect.stringContaining("validity") });
  });
});

describe("verification refuses what the release cannot prove", () => {
  test("with a trust anchor, a key with no x5c chain fails", async () => {
    const anchor = await generateKeyPair();
    const k = await generateKeyPair();
    const did = "did:web:example.net";
    const doc = didDocument(did, [{ fragment: "k", jwk: k.publicJwk, active: true }]);
    const jws = await signDetached("payload", k.privateKey, `${did}#k`);
    expect(await verifyDetached("payload", jws, doc, { anchors: [anchor.publicJwk] })).toMatchObject({ state: "failed", reason: expect.stringContaining("no certificate chain") });
  });

  test("a kid outside the expected DID fails", async () => {
    const k = await generateKeyPair();
    const did = "did:web:example.net";
    const doc = didDocument(did, [{ fragment: "k", jwk: k.publicJwk, active: true }]);
    const jws = await signDetached("payload", k.privateKey, `${did}#k`);
    expect(await verifyDetached("payload", jws, doc, { expectDid: "did:web:example.org" })).toMatchObject({ state: "failed", reason: expect.stringContaining("expected DID") });
    expect(await verifyDetached("payload", jws, doc, { expectDid: did })).toMatchObject({ state: "verified" });
  });

  test("did:web with a host or path that is not plain is refused", () => {
    expect(() => didWebUrl("did:web:a.org%2Fb")).toThrow(/host/);
    expect(() => didWebUrl("did:web:user%40a.org")).toThrow(/host/);
    expect(() => didWebUrl("did:web:a.org:..")).toThrow(/segment/);
    expect(() => didWebUrl("did:web:a.org:x%2Fy")).toThrow(/segment/);
  });
});

describe("IRIS values used as path segments are refused, never repaired", () => {
  test("handles, uuids and segments", async () => {
    const { handleProblem, itemKey, segmentProblem, uuidProblem } = await import("../iris-cdn/run.ts");
    expect(handleProblem("10665/123")).toBeNull();
    for (const h of ["10665/1/x", "../1", "10665/1\n", "", 7]) expect(handleProblem(h)).not.toBeNull();
    expect(uuidProblem("0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b")).toBeNull();
    expect(uuidProblem("x/../y")).not.toBeNull();
    expect(segmentProblem("report.pdf")).toBeNull();
    for (const n of ["", ".", "..", "a/b", "a\\b", "a\nb", null]) expect(segmentProblem(n)).not.toBeNull();
    expect(itemKey(undefined, "0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b")).toBe("uuid/0f1e2d3c-4b5a-6978-8a9b-0c1d2e3f4a5b");
    expect(() => itemKey("10665/1/../2", "u")).toThrow(/handle/);
  });
});

describe("per-item manifests (Q4 A)", () => {
  test("an item's manifest holds its record and files only, and is stable", async () => {
    const { itemManifest, itemManifestPath } = await import("../iris-cdn/bag.ts");
    const all = [e("records/10665/1.json", "r1"), e("bitstreams/10665/1/ORIGINAL/a.pdf", "pdf"), e("records/10665/12.json", "r12"), e("bitstreams/10665/12/ORIGINAL/b.pdf", "x")];
    const m = itemManifest("10665/1", all);
    expect(m.split("\n").filter(Boolean).map((l) => l.split(" ")[1])).toEqual(["data/bitstreams/10665/1/ORIGINAL/a.pdf", "data/records/10665/1.json"]);
    expect(itemManifest("10665/1", [...all].reverse())).toBe(m);
    expect(itemManifestPath("10665/1")).toBe("items/10665/1/manifest-sha256.txt");
    expect(() => itemManifest("10665/9", all)).toThrow(/no record/);
  });

  test("a metadata-only change moves the record digest and not the PDF's", async () => {
    const { itemManifest, parsePayloadManifest } = await import("../iris-cdn/bag.ts");
    const before = parsePayloadManifest(itemManifest("10665/1", [e("records/10665/1.json", "title A"), e("bitstreams/10665/1/ORIGINAL/a.pdf", "pdf")]));
    const after = parsePayloadManifest(itemManifest("10665/1", [e("records/10665/1.json", "title B"), e("bitstreams/10665/1/ORIGINAL/a.pdf", "pdf")]));
    expect(diffManifests(before, after)).toEqual({ added: [], changed: ["records/10665/1.json"], removed: [], unchanged: 1 });
  });
});

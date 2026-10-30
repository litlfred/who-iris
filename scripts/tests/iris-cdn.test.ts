import { describe, expect, test } from "bun:test";
import { diffManifests, isEmptyDiff, parsePayloadManifest, payloadManifest, sha256Hex, tagFiles, type PayloadEntry } from "../iris-cdn/bag.ts";
import { didDocument, didWebUrl, generateKeyPair, signDetached, verifyDetached } from "../iris-cdn/signing.ts";
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

describe("did:web + detached JWS (RFC 7515 App. F, RFC 8037)", () => {
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

    expect(await verifyDetached(payload, jws, doc)).toEqual({ state: "verified", kid: `${did}#release-2026` });
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

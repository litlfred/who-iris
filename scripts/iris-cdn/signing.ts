/**
 * Signing and verifying an IRIS CDN release, using published standards only:
 *
 *  - the signed bytes are the bag's `tagmanifest-sha256.txt` (RFC 8493), which
 *    pins every tag file, which pins every payload file by SHA-256;
 *  - the signature is a JWS with a DETACHED payload (RFC 7515 Appendix F):
 *    compact serialization with the payload segment left empty;
 *  - the algorithm is EdDSA over Ed25519 (RFC 8037);
 *  - the header's `kid` is a DID URL (W3C DID Core 1.0) naming a
 *    `verificationMethod` of type `JsonWebKey` (W3C Controlled Identifiers
 *    1.0) whose `publicKeyJwk` (RFC 7517) carries the key;
 *  - the DID method is `did:web`, which the owner approved. No GDHCN trust
 *    list is assumed; a verifier resolves the key from the DID document, and
 *    never from the package itself.
 *
 * One signature per release, not per file: an unchanged night produces the
 * same tag manifest and therefore needs no new signature at all.
 */
import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;

const b64url = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64url");
const fromB64url = (s: string): Uint8Array => new Uint8Array(Buffer.from(s, "base64url"));
const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);

/** RFC 8037 §2: an Ed25519 public key as a JWK. */
export interface OkpPublicJwk {
  kty: "OKP";
  crv: "Ed25519";
  x: string;
}

/**
 * `did:web` → the URL of its DID document, per the did:web method
 * specification: `:` separates path segments, `%3A` encodes a port, and a
 * DID with no path resolves under `/.well-known/`.
 */
export function didWebUrl(did: string): string {
  const m = /^did:web:([^#?]+)$/.exec(did);
  if (!m) throw new Error(`not a did:web DID: ${did}`);
  const [host, ...path] = m[1].split(":").map(decodeURIComponent);
  if (!host) throw new Error(`did:web has no host: ${did}`);
  return path.length === 0 ? `https://${host}/.well-known/did.json` : `https://${host}/${path.join("/")}/did.json`;
}

/** The DID document that publishes the release key(s). */
export interface DidDocument {
  "@context": string[];
  id: string;
  verificationMethod: { id: string; type: "JsonWebKey"; controller: string; publicKeyJwk: OkpPublicJwk }[];
  assertionMethod: string[];
}

/**
 * Build the DID document for `did` from its keys, in a fixed order so that
 * re-publishing it with the same keys writes the same bytes. Keep retired
 * keys listed (out of `assertionMethod`) for as long as releases they signed
 * are served: a verifier of an old release still needs them.
 */
export function didDocument(did: string, keys: { fragment: string; jwk: OkpPublicJwk; active: boolean }[]): DidDocument {
  didWebUrl(did);
  const sorted = [...keys].sort((a, b) => (a.fragment < b.fragment ? -1 : 1));
  return {
    "@context": ["https://www.w3.org/ns/did/v1", "https://www.w3.org/ns/cid/v1"],
    id: did,
    verificationMethod: sorted.map((k) => ({
      id: `${did}#${k.fragment}`,
      type: "JsonWebKey",
      controller: did,
      publicKeyJwk: { kty: "OKP", crv: "Ed25519", x: k.jwk.x },
    })),
    assertionMethod: sorted.filter((k) => k.active).map((k) => `${did}#${k.fragment}`),
  };
}

export async function generateKeyPair(): Promise<{ privateKey: webcrypto.CryptoKey; publicJwk: OkpPublicJwk }> {
  const pair = (await subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as webcrypto.CryptoKeyPair;
  const jwk = (await subtle.exportKey("jwk", pair.publicKey)) as { x: string };
  return { privateKey: pair.privateKey, publicJwk: { kty: "OKP", crv: "Ed25519", x: jwk.x } };
}

/** Import a private key from its JWK (`d` and `x`), e.g. from a CI secret. */
export async function importPrivateJwk(jwk: { kty: "OKP"; crv: "Ed25519"; x: string; d: string }): Promise<webcrypto.CryptoKey> {
  return subtle.importKey("jwk", jwk, { name: "Ed25519" }, false, ["sign"]);
}

/** Sign `payload` (the tag manifest's bytes); returns `<header>..<signature>`. */
export async function signDetached(payload: string, key: webcrypto.CryptoKey, kid: string): Promise<string> {
  if (!/^did:web:[^#]+#.+$/.test(kid)) throw new Error(`kid must be a did:web DID URL with a fragment: ${kid}`);
  const header = b64url(utf8(JSON.stringify({ alg: "EdDSA", kid })));
  const input = utf8(`${header}.${b64url(utf8(payload))}`);
  const sig = new Uint8Array(await subtle.sign({ name: "Ed25519" }, key, input));
  return `${header}..${b64url(sig)}`;
}

export type Verdict =
  | { state: "verified"; kid: string }
  | { state: "failed"; reason: string }
  /** The key could not be obtained. Not the same as a bad signature. */
  | { state: "unknown"; reason: string };

/**
 * Verify a detached JWS over `payload` against the DID document `doc`
 * (already resolved by the caller from `didWebUrl`, so this stays offline and
 * testable). The key must be listed under `assertionMethod`.
 */
export async function verifyDetached(payload: string, jws: string, doc: DidDocument | null): Promise<Verdict> {
  const parts = jws.split(".");
  if (parts.length !== 3 || parts[1] !== "") return { state: "failed", reason: "not a detached compact JWS" };
  let header: { alg?: string; kid?: string; crit?: unknown };
  try {
    header = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
  } catch {
    return { state: "failed", reason: "header is not JSON" };
  }
  if (header.alg !== "EdDSA") return { state: "failed", reason: `unsupported alg ${header.alg}` };
  if (header.crit !== undefined) return { state: "failed", reason: "crit header not supported" };
  const kid = header.kid;
  if (!kid) return { state: "failed", reason: "no kid" };
  if (!doc) return { state: "unknown", reason: `DID document for ${kid} not available` };
  if (!kid.startsWith(`${doc.id}#`)) return { state: "failed", reason: `kid ${kid} is not a key of ${doc.id}` };
  if (!doc.assertionMethod.includes(kid)) return { state: "failed", reason: `${kid} is not an assertionMethod` };
  const vm = doc.verificationMethod.find((v) => v.id === kid);
  if (!vm) return { state: "failed", reason: `${kid} not in verificationMethod` };
  const key = await subtle.importKey("jwk", vm.publicKeyJwk, { name: "Ed25519" }, false, ["verify"]);
  const input = utf8(`${parts[0]}.${b64url(utf8(payload))}`);
  const ok = await subtle.verify({ name: "Ed25519" }, key, fromB64url(parts[2]), input);
  return ok ? { state: "verified", kid } : { state: "failed", reason: "signature does not match" };
}

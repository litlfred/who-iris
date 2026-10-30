---
name: iris-cdn-signing
description: >
  How an IRIS CDN release is packaged, signed and verified using published
  standards only: a BagIt bag (RFC 8493), one detached JWS (RFC 7515 App. F)
  with EdDSA over Ed25519 (RFC 8037), and the key published as a JsonWebKey
  verificationMethod of a did:web DID document. No GDHCN trust list is assumed.
graph-typologies:
  - catalogue
---

# Signing and verifying an IRIS CDN release

The code is `scripts/iris-cdn/bag.ts` and `scripts/iris-cdn/signing.ts`. The
process is `processes/iris-cdn-sign-publish.bpmn`.

## Standards used, and nothing else

| Piece | Standard |
|---|---|
| Package and digests | BagIt 1.0, **RFC 8493**: `bagit.txt`, `bag-info.txt`, `manifest-sha256.txt`, `tagmanifest-sha256.txt` |
| Signature | JWS compact serialization with a **detached payload**, **RFC 7515** Appendix F |
| Algorithm | `EdDSA` with Ed25519, **RFC 8037** |
| Public key | JWK, **RFC 7517**, as `publicKeyJwk` |
| Key publication | W3C **DID Core 1.0** document, `verificationMethod` of type `JsonWebKey` from W3C **Controlled Identifiers 1.0** |
| DID method | **`did:web`**, approved by the owner |

No draft standards are used. A new one needs the owner's explicit approval.

## What is signed

There is **one signature per release**, over the bytes of
`tagmanifest-sha256.txt`. That file pins the SHA-256 of every other tag file,
and `manifest-sha256.txt` pins the SHA-256 of every payload file. Signing the
tag manifest therefore covers the whole bag.

The signature is stored beside the tag manifest as
`tagmanifest-sha256.txt.jws`, in the form `<header>..<signature>`. The empty
middle segment is the detached payload. The protected header is
`{"alg":"EdDSA","kid":"did:web:…#<key>"}`.

An unchanged night produces the same tag manifest, so it gets no new
signature.

## Where the key comes from

The verifier resolves the `kid`'s DID **from the web**, never from the
package:

- `did:web:<cdn-domain>` resolves to `https://<cdn-domain>/.well-known/did.json`,
  and `did:web:<cdn-domain>:iris` resolves to `https://<cdn-domain>/iris/did.json`.
  The domain is open question Q10. It must be stable, because the DID *is* the
  signer's identity.
- The key must be listed under `assertionMethod`. A retired key stays in
  `verificationMethod` so that old releases still verify, but it is removed
  from `assertionMethod`. A signature by that retired key on a *new* release
  then fails.

If the DID document cannot be fetched, the verdict is **`unknown`**, not
`failed` and not `verified`. A portal that cannot check says so.

Trust anchors other than `did:web` are not assumed. If the owner later wants a
trust list, such as GDHCN via WHO SMART Trust, it would be an *additional*
route to the same DID document, never a replacement for it.

## Key custody and rotation

- The private key is a JWK (`kty: OKP`, `crv: Ed25519`, `d`, `x`). It never
  goes into git, a log or a bean. Where it lives is open question Q9; the
  recommendation is the GitHub **environment** secret `IRIS_CDN_SIGNING_JWK`
  in environment `iris-cdn-release`, restricted to `main`.
- To rotate:
  1. Add the new key to the DID document and to `assertionMethod`.
  2. Publish the DID document.
  3. Sign the next release with the new key.
  4. Take the old key out of `assertionMethod`, and keep it in
     `verificationMethod`.
- The DID document is built in a fixed order, so republishing it with the
  same keys writes the same bytes.

## Verifying by hand

```sh
# 1. digests
cd bag && sha256sum -c manifest-sha256.txt && sha256sum -c tagmanifest-sha256.txt
# 2. signature
bun -e 'import {verifyDetached} from "./scripts/iris-cdn/signing.ts"; …'
```

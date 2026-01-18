# 09 — IPFS publishing (MVP)

Goal: host the **agent card** and **UI manifest** on IPFS (content-addressed).

## What to publish
Upload a directory containing:
- `agent-card.json`
- `ui-manifest.json`
- optional: `preview-bundle.json` (if not inlined)
- optional: `thumb.webp`

In this zip, these live in `artifacts/`.

## Option A: local IPFS daemon
1) Install IPFS.
2) From repo root:

```bash
ipfs add -r artifacts
```

You’ll get a directory CID like:
- `ipfs://<DIR_CID>/agent-card.registration.json`
- `ipfs://<DIR_CID>/ui-manifest.v2.json`

### Update pointers
- Update `agent-card.registration.json` to point `A2UI_MANIFEST` to the new manifest path.
- Update `ui-manifest.v2.json` to use the new `agentId` once minted.

## Option B: pinning services
For testnet MVP, any IPFS pinning provider is fine.
- Upload the `artifacts/` folder.
- Use the returned directory CID.

## Integrity (optional for MVP)
UI Manifest v2 draft supports digests/signatures. Skip in MVP unless you want tamper evidence in previews.

# Skill: ERC-8004 + IPFS wiring

## Goal
Make the widget discoverable through the pointer chain:
`agentId -> tokenURI -> agent card -> A2UI_MANIFEST -> manifest -> preview/live`.

## Tasks
1. Publish `artifacts/` folder to IPFS.
2. Update `agent-card.registration.json` to point to the IPFS manifest.
3. Mint agent handle on Base Sepolia using `register(string)`.
4. Update manifest `agentId` to minted tokenId (string).
5. Smoke-test: host fetches tokenURI and renders preview.

## Footguns
- `agentId` must be a string to avoid JS precision issues.
- Don’t rely on HTTP if you can use `ipfs://`.

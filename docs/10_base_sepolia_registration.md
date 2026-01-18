# 10 — Base Sepolia: ERC-8004 registration steps

## Network constants
- Chain ID: `84532`
- RPC: `https://sepolia.base.org`

## Identity registry (ecosystem deployment)
This prototype assumes the existing Base Sepolia ERC-8004 IdentityRegistry used in the Filecoin Pin tutorial:
- IdentityRegistry: `0x7177a6867296406881E20d6647232314736Dd09A`

## Register / mint agent handle
1) Ensure you have Base Sepolia ETH.
2) Upload `agent-card.registration.json` to IPFS and copy its URI.
3) Mint via `register(string)`.

Example using Foundry `cast`:
```bash
cast send 0x7177a6867296406881E20d6647232314736Dd09A \
  "register(string)" \
  "ipfs://<DIR_CID>/agent-card.registration.json" \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

4) Read the emitted `agentId` (tokenId) from the transaction logs.
5) Update `ui-manifest.v2.json` field `agentId` to that value (as a string).

## Verify
- Query `tokenURI(agentId)` and confirm it matches the agent card IPFS URI.

# Agent endpoints plan

This project aims for the agent to be discoverable via ERC-8004 and usable via A2A + A2UI.

## Minimum required externally
- **A2A endpoint** (HTTPS): e.g. `POST /a2a`
  - must accept A2UI extension enabling
  - must stream or return A2UI message parts

## Optional but useful
- `GET /.well-known/agent-card.json` (A2A agent card)
- `GET /health`

## Deployment uncertainty
ElizaCloud may allow:
- full project container deploy (custom code + routes)
- or only character-based config

Treat "custom routes" exposure as an **acceptance test**:
- If blocked: host static agent card + UI manifest on IPFS/HTTPS, and only rely on the single A2A endpoint.

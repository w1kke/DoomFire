# 11 — Deployment options (ElizaCloud vs VM)

## Option A (preferred): ElizaOS Cloud full project deploy
If ElizaCloud supports deploying a full agent project (code + plugins), use it to:
- run the Eliza agent
- expose A2A endpoint

**Open question:** whether ElizaCloud exposes arbitrary custom HTTP routes in production for your account. Treat this as a deployment test item.

## Option B (safe fallback): VM deployment
Host:
- the Eliza agent runtime
- a small reverse proxy (Caddy/Nginx) for TLS
- static files for agent card + ui manifest (or IPFS)

## What to test early
- Can the agent run with your custom plugin code?
- Can the A2A endpoint accept the A2UI extension header and stream responses?
- Can you access logs/metrics needed for debugging?

See `test/acceptance_criteria.md` for explicit checks.

## Local run (host + ElizaOS agent)
1) Install ElizaOS dependencies:
   `cd agent/eliza-develop && bun install`
2) Start the Cozy DoomFire project:
   `cd agent/eliza-develop/packages/project-cozy-doomfire && bun run start -- --port 4174`
   (First run builds the ElizaOS server packages if `dist/` outputs are missing.)
3) Start the host pointing at the plugin route:
   `A2A_ENDPOINT="http://127.0.0.1:4174/cozy-doomfire/a2a" npm run dev`

## Local run (legacy stub agent)
1) Start the stub agent: `npm run agent` (defaults to `http://127.0.0.1:4174/a2a`).
2) Start the host with `A2A_ENDPOINT` set:
   `A2A_ENDPOINT="http://127.0.0.1:4174/a2a" npm run dev`.

## Deployment wiring
- Ensure the agent card advertises the public A2A endpoint under `endpoints[].name = "A2A"`.
- When using `agentId` discovery, the host reads the A2A endpoint from the agent card.
- When running the host without discovery (local manifest), set `A2A_ENDPOINT` to the agent URL.
- The ElizaOS routes are defined in `agent/eliza-develop/packages/project-cozy-doomfire/src/plugin.ts`.

## Tests
Playwright uses the real ElizaOS agent by default via `playwright.config.js`
and starts `agent/eliza-develop/packages/project-cozy-doomfire/src/server.ts`.
Run `bun install` in `agent/eliza-develop` once before `npm test`.

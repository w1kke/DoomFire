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

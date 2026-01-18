# 06 — Host security policy (Preview vs Engage)

This prototype intentionally adopts strict policies from the broader Pocket Studio security test plan:
- Preview must be side-effect free.
- Live sessions must be explicit, labeled, rate-limited, and constrained.

## Modes

### Browse Mode (listing)
- Render thumbnail only (no A2UI render in-feed).

### Preview Mode (detail preview)
**Hard rules** (fail closed):
- Allow only surfaceId = `preview`.
- Deny network fetches triggered by widget payload.
- Deny external navigation and deep links.
- Deny clipboard writes.
- Deny wallet intents.
- Validate every message and every component id.
- Enforce caps:
  - max bundle bytes
  - max components
  - max nesting depth
  - max string length

### Engage Mode (live)
- Requires explicit user gesture.
- Show LIVE badge + agent identity.
- Allow only surfaces declared by widget contract (here: `main`).
- Enforce event allowlist (here: `fire.applySettings`, `fire.setAudioEnabled`).
- Throttle inbound message rate; terminate session on sustained violation.
- Wallet intents remain disabled for this prototype.

## Suggested caps (tune later)
- `MAX_PREVIEW_BUNDLE_BYTES`: 200 KB
- `MAX_PREVIEW_COMPONENTS`: 200
- `MAX_NESTING_DEPTH`: 20
- `MAX_STRING_LEN`: 4,000
- `MAX_LIVE_UPDATES_PER_SEC`: 10

## Developer mode (Inspector)
- Log validation errors and policy violations.
- In production, log **digests**, not full payloads.

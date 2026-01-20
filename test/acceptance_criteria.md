# Acceptance criteria

## AC-001 — Preview shows up from manifest
Given a valid UI Manifest v2 and preview bundle,
- Host renders preview without starting a session.
- Host does not crash on malformed bundles; shows a safe fallback.
- Playwright: "Preview renders safely" (preview surface + no live session)

## AC-002 — Preview sandbox is enforced
In Preview Mode:
- Only surface `preview` is allowed.
- No outbound network requests occur due to widget payload.
- External links and navigation actions are blocked.
- Wallet intents are blocked.
- Playwright: "Preview renders safely" (network + navigation checks)
- Playwright: "Preview sandbox shows fallback on disallowed payload"

## AC-003 — ERC-8004 pointer chain works (Base Sepolia)
Given `agentRegistry` = Base Sepolia IdentityRegistry and `agentId`:
- Host reads `tokenURI(agentId)`.
- Fetches the agent card JSON (IPFS gateway allowed).
- Reads `A2UI_MANIFEST` endpoint and fetches UI Manifest.

## AC-004 — Live session is gated and labeled
- Live session does not start without explicit user click.
- Once started, LIVE badge is visible.
- Only declared surface IDs are rendered.
- Playwright: "Ignite applies settings and changes the fire palette"

## AC-005 — Agent fully authors the UI
- The host does not hard-code widget layout.
- All UI updates come from A2UI messages.
- Live UI is delivered by the agent endpoint (A2A).
- Playwright: "No agent => no live UI"

## AC-006 — Ignite is a single event
- Changing controls does not send any event.
- Pressing Ignite sends exactly one `fire.applySettings` event.
- Playwright: "Ignite applies settings and changes the fire palette"

## AC-007 — Narration reflects progress
- On Ignite, narration progresses through at least 3 phases.
- Timing is not fixed; phases can reflect processing/latency.
- Playwright: "Ignite applies settings and changes the fire palette"

## AC-008 — DoomFire renderer is deterministic
- Given seed+settings, the rendered framebuffer hash is stable.

## AC-009 — Audio respects autoplay policy
- Audio does not play until an explicit user gesture.
- Audio loops without audible clicks.
- Playwright: "Audio is opt-in and toggle works"

## AC-010 — ElizaCloud feasibility check
One of:
- A) ElizaCloud deploy supports running custom code/plugins needed for the A2A + A2UI behavior.
- B) Fallback VM plan is used and documented.

## Playwright regression suite (user actions)
- "Preview renders safely"
- "No agent => no live UI"
- "Ignite applies settings and changes the fire palette"
- "Audio is opt-in and toggle works"
- "Reset returns to defaults"
- "No console errors / unhandled rejections"

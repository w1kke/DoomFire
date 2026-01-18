# Build order (Codex-friendly)

Implement in small PRs. Every PR must:
- add or update a test
- update acceptance criteria status

## PR0 — Repo scaffolding
- Add `docs/`, `artifacts/`, `test/` structure.
- Add JSON validation utilities (schema checks).

## PR1 — Manifest + preview ingestion
- Host can load a UI manifest from a local JSON file.
- Host can render the preview bundle in a sandbox.
- Tests: manifest validation + preview surface allowlist.

## PR2 — ERC-8004 pointer chain
- Host can fetch tokenURI from Base Sepolia IdentityRegistry, then fetch agent card and manifest.
- Tests: mock chain RPC; fallback to local mode.

## PR3 — Live A2A session plumbing
- Host can open a live session and render A2UI messages from the agent.
- Tests: session gating (explicit user click), LIVE badge, event allowlist.

## PR4 — Custom component: DoomFireCanvas
- Implement the doom fire effect in Canvas/WebGL.
- Add deterministic palette + parameter mapping.
- Tests: determinism snapshot test (seed + params -> identical framebuffer hash).

## PR5 — Audio
- Add crackle audio playback that starts only after a user gesture.
- Add volume mapping.
- Tests: autoplay policy compliance (audio remains muted until enabled).

## PR6 — Ignite flow + narration
- Staged controls + single `Ignite` event.
- Agent emits narration steps.
- Host animates fire transition.
- Tests: only one event per Ignite; narration sequence ordering.

## PR7 — Harden sandbox and caps
- Enforce preview caps and deny-by-default actions.
- Tests: known-bad vectors.

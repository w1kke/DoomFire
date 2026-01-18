# AGENTS.md - Guardrails for AI coding agents

This repository is spec/test-driven. Any AI agent (Codex, etc.) working on this codebase MUST follow this file.

## 0. Mission

Ship a single, working prototype:

- One A2UI host website that can:
  - resolve the ERC-8004 pointer chain on Base Sepolia (agentId -> tokenURI -> agent card -> A2UI manifest),
  - render a preview bundle safely (no session),
  - start a live session only after an explicit user action,
  - render a local Canvas/WebGL DoomFire fireplace and play looping crackle audio.
- One ElizaOS agent that:
  - fully authors the A2UI UI layout,
  - accepts one event per interaction (Ignite) and responds with narration + final applied state.

Definition of done: all items in `test/acceptance_criteria.md` are satisfied.

## 1. Read-first order

Before changing any code:

1) `test/acceptance_criteria.md`
2) `docs/00_overview.md`
3) `docs/01_requirements.md`
4) `docs/06_host_policy.md`
5) `skills/00_build_order.md`

If an implementation idea conflicts with these documents, DO NOT implement it.

## 2. Locked scope decisions (do not change in v0)

The following decisions are locked for v0. If you want to change them, open a design issue first.

- Visual style: DOOM fire algorithm (pixel framebuffer + palette). No Minecraft asset copying.
- Rendering: local Canvas/WebGL (or Canvas2D if acceptable for the effect) driven by deterministic state.
- Audio: a looped crackle sample (e.g., Pixabay). No procedural audio required in v0.
- UX interaction:
  - controls are staged;
  - user presses a single button labeled "Ignite";
  - pressing Ignite sends exactly one event: `fire.applySettings`.
- Determinism: given seed + settings, the renderer output must be stable.
- UI authority: the agent authors the UI. The host must not hard-code widget layout.
- Discovery: UI Manifest v2 + preview bundle required.
- Hosting of static artifacts: IPFS preferred; HTTPS fallback allowed for testnet convenience.
- Payments: skipped in v0 (no x402, no USDC flows).
- Deep chat / emotional support: out of scope in v0.

## 3. Hard non-goals (do not implement)

- Streaming video/audio from the agent.
- GenAI video generation, MP4 export, or shareable deliverables.
- Wallet intents, signing, transactions, or any payment UX.
- External links / navigation triggered by widget payloads.
- Auto-downloading or "installing" catalogs from the network.
- Open UGC publishing, public marketplace, moderation.
- Multi-widget manifest (v0 ships exactly one widget).

## 4. A2UI host rules (security + correctness)

### 4.1 Preview mode must be sandboxed
Preview rendering MUST enforce:
- surface allowlist: only `preview`.
- no outbound network requests caused by widget payload.
- no external navigation / deep links.
- no wallet intents.
- strict caps on bundle size and complexity.

If any rule is violated, fail closed: do not render partial UI. Show a safe fallback placeholder.

### 4.2 Live mode must be gated and labeled
- A live session MUST NOT start until the user explicitly clicks "Open" (or similar).
- While live, show a persistent "LIVE" badge.
- Enforce surface allowlist (intersection of widget contract + host policy).
- Enforce event allowlist (only event types declared in the widget contract).

### 4.3 Deny-by-default action dispatch
All actions coming from UI must go through a host-controlled dispatcher.
- Unknown actions are blocked.
- URL actions are blocked (unless explicitly allowlisted by the host; v0 should block all).

## 5. Fireplace interaction contract

The only required user interaction loop in v0:

1) User adjusts controls locally (no events sent).
2) User clicks "Ignite".
3) Host sends exactly one event: `fire.applySettings` with the staged values.
4) Agent responds with narration steps (>= 3 phases) and a final applied state.
5) Host animates transition locally.

Narration timing does not need to be fixed. It may reflect actual latency/states.

## 6. Determinism rules

- The DoomFire visual must be deterministic given seed + settings.
- Implement a deterministic test that hashes framebuffer output.
- Avoid nondeterministic sources (Date.now, Math.random without a seeded RNG).

## 7. ElizaCloud uncertainty

It is unknown whether ElizaCloud will expose custom endpoints for our full deployment.

v0 MUST satisfy acceptance criterion AC-010 by doing one of:
- A) Confirm ElizaCloud supports custom code/plugins needed for A2A + A2UI behavior.
- B) Use the fallback VM deployment plan and document it.

Do not guess. Create an explicit test/check and document the outcome.

## 8. Required workflow (how you work)

### 8.1 PR discipline
- Small PRs only. Follow `skills/00_build_order.md`.
- Every PR must:
  - add/update tests,
  - update acceptance criteria status (or traceability),
  - keep scope minimal.

### 8.2 Test-first
- For any new behavior, add a failing test first.
- Do not merge if tests are failing.

### 8.3 Documentation
If you change an interface (JSON shape, event name, policy), update:
- `docs/` and/or
- `artifacts/` and/or
- `test/traceability_matrix.md`

## 9. PR checklist (copy into each PR description)

- [ ] I read `AGENTS.md` and `test/acceptance_criteria.md`.
- [ ] This PR targets one small milestone / acceptance criterion.
- [ ] I added or updated automated tests.
- [ ] Preview sandbox rules remain enforced (no network, no external links, no wallet intents, surface allowlist).
- [ ] Live session is gated and labeled.
- [ ] No new scope added (payments, streaming, chat, external navigation).
- [ ] Determinism tests pass.
- [ ] Docs/artifacts updated if needed.


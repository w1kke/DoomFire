# DoomFire Cozy Fireplace — ERC-8004 × A2UI Prototype (Base Sepolia)

This repo is a **spec/test-driven package** for a first prototype:

- An **ERC-8004-registered agent** on **Base Sepolia**.
- A discoverable **A2UI UI Manifest (v2)** that advertises a **LiveWidget** with a safe **preview bundle**.
- A minimal **A2UI host website** that:
  - resolves the ERC-8004 pointer chain (agentId → tokenURI → agent card → A2UI manifest),
  - renders the preview in a strict sandbox,
  - starts an Engage session (A2A + A2UI extension),
  - renders a custom component: **DoomFireCanvas** (Canvas/WebGL) + **fire crackle audio**.
- An **ElizaOS agent** that fully authors the A2UI layout and sends deterministic state updates.

## Design choices (locked for v0)

- Visual: **DOOM fire effect** (pixel cult, fully procedural, deterministic).
- Audio: **license-friendly fire crackle sample** (Pixabay), looped.
- UX: sliders + presets are staged; user presses **Ignite** to apply; narration steps reflect progress/latency.
- Payments: **skipped** for now (x402/USDC later).

## What you get in this repository

- `AGENTS.md` — guardrails for AI coding agents (keeps scope locked).
- `SKILLS.md` — required tool capabilities / tool-call primitives (RALPH-friendly).
- `PROMPTS.md` — copy/paste prompts to start and run an acceptance-driven dev loop.
- `docs/` — architecture, protocol artifacts, deployment notes.
- `artifacts/` — example ERC-8004 agent card, UI Manifest v2, preview bundle, catalog stub.
- `test/` — acceptance criteria + test plan + traceability matrix + JSON test vectors.
- `agent/` — character + system prompt + endpoint plan (two deployment modes).
- `skills/` — Codex-friendly implementation skills/tasks (what to build, in what order).

## How to use

1. Read `docs/00_overview.md` then `test/acceptance_criteria.md`.
2. Implement in small PRs using the order in `skills/00_build_order.md`.
3. Use the JSON in `artifacts/` as the starting point.

## References

- UI Manifest v2 draft (internal): see `docs/03_ui_manifest_v2.md`.
- Base Sepolia ERC-8004 registry address used by Filecoin Pin tutorial: see `docs/10_base_sepolia_registration.md`.

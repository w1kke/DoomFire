# 00 — Overview

## Goal
Build the smallest possible **end-to-end** prototype that proves:

1) **ERC-8004 discovery** works on Base Sepolia (agentId → tokenURI → agent card → UI manifest).
2) A host can render a **safe preview** from an **A2UI message bundle**.
3) A host can start a **live A2A session** with the **A2UI extension enabled** and render a fully agent-authored UI.
4) The UI can drive a **local** interactive experience: **DOOM fire effect** (Canvas/WebGL) + looped crackle audio.

This prototype is *not* a general marketplace, not a full app, and does not include payments.

## What the user experiences
- Sees a preview card of the "Cozy DoomFire" widget (thumbnail + preview A2UI).
- Clicks **Open** (engage) → the host opens a live session.
- Sees the full interface:
  - pixel fire viewport
  - preset picker ("Cozy Amber", "Copper Blue", …)
  - sliders (size, intensity, heat)
  - **Ignite** button
  - playful narration ("Collecting wood…", "Stacking logs…", …)
- Changes settings, presses **Ignite**, sees narration steps and fire transitions.

## Why DOOM fire
- It’s iconic *and* algorithmic.
- It’s extremely lightweight, deterministic, and easy to recolor.
- It provides a clear demo that is visually interesting without requiring GenAI or video streaming.

## Constraints (MVP)
- Deterministic output: same inputs → same fire.
- One surface for preview (`preview`) and one surface for live (`main`).
- No external links, no wallet intents, no network requests triggered by widget payloads in preview.

## Out of scope
- x402, USDC payments
- MP4 export / sharing
- Memory / “emotional support” conversation
- Any real-world instructions about adding chemicals to fires

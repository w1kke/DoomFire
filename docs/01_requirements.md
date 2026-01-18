# 01 — Requirements

## Functional requirements

### R1. ERC-8004 discovery
- R1.1 The host MUST resolve the agent card via ERC-8004 `tokenURI(agentId)`.
- R1.2 The agent card MUST include endpoint `A2UI_MANIFEST` (version `2`).
- R1.3 The host MUST fetch the manifest and list widgets.

### R2. UI Manifest v2
- R2.1 Manifest MUST be compatible with UI Manifest v2 draft.
- R2.2 It MUST describe exactly one LiveWidget: `com.cozy.doomfire.live`.
- R2.3 It MUST include a preview section with a strict preview policy and a preview payload.
- R2.4 `agentId` MUST be represented as a string (decimal recommended).

### R3. Preview rendering
- R3.1 Host MUST render preview A2UI bundle in Preview Mode.
- R3.2 Preview Mode MUST enforce sandbox: single surface, no network, no external links, no wallet intents.
- R3.3 Preview MUST show enough UI to advertise: title, short description, and an Open button.

### R4. Live session rendering
- R4.1 Host MUST start a live A2A session only after explicit user action.
- R4.2 Live session MUST be visibly labeled (e.g., LIVE badge).
- R4.3 Live UI MUST be entirely authored by the agent (host provides only the renderer + catalogs).

### R5. Fireplace interaction model
- R5.1 Controls are staged: changing sliders does not immediately apply.
- R5.2 Pressing **Ignite** sends a single event `fire.applySettings`.
- R5.3 Agent responds with narration step updates and a final state update.
- R5.4 Host animates the fire transition locally from old state to new state.

### R6. Visual + audio
- R6.1 Visual uses DOOM fire algorithm (pixel framebuffer + palette).
- R6.2 Audio uses a looped crackle file sourced from Pixabay (or equivalent) and starts only after a user gesture.
- R6.3 Audio volume reacts to intensity/heat.

## Non-functional requirements

### NFR1. Determinism
Given the same settings + seed, the fire visual state MUST be deterministic.

### NFR2. Performance
- Preview renders in < 200ms on a typical laptop.
- Live renders at >= 30 FPS on mid-range mobile.

### NFR3. Safety boundaries
- Widget payloads are treated as data; host renders only via allowlisted catalogs.
- Preview payload MUST NOT trigger network.

### NFR4. Developer onboarding
- A newcomer must be able to follow the docs and build a new widget by cloning this structure.

## Success definition
All acceptance criteria in `test/acceptance_criteria.md` pass.

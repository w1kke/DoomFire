# Skill: ElizaOS agent (A2UI author)

## Responsibilities
- Implement `renderWidget` (returns full A2UI layout).
- Validate events and maintain state.
- Emit narration phases.

## Determinism
- Never use randomness unless derived from `seed`.
- Keep preset palettes hardcoded.

## Suggested internal structure
- A pure function: `applySettings(state, payload) -> newState`.
- A message builder: `renderA2ui(state) -> messages[]`.

## Endpoint considerations
- If ElizaCloud doesn't expose custom routes: serve `agent-card` and `ui-manifest` from IPFS/HTTPS and only require the A2A message endpoint.

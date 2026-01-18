# 07 — ElizaOS agent behavior

## Responsibilities
- Implement `renderWidget` for widgetId `com.cozy.doomfire.live`.
- Maintain the widget state model.
- Validate and handle events:
  - `fire.applySettings`
  - `fire.setAudioEnabled`
- Stream A2UI messages to render:
  - UI layout (controls + narration)
  - data model updates (staged/applied state)
  - narration updates during Ignite flow

## Non-goals
- No therapy / emotional support conversation.
- No payments.
- No wallet actions.

## Event handling

### `fire.applySettings`
1) Validate payload.
2) Emit narration:
   - collecting → stacking → striking
3) Update `applied` settings and set phase to `burning`.
4) Emit final narration.

Recommended: make the narration timing depend on real processing (not fixed).

## UI authorship
The agent should produce the full A2UI tree:
- Title + tagline
- DoomFireCanvas viewport component
- Preset selector + sliders
- Ignite button
- Narration text area
- Toggle for audio (or a distinct button that can satisfy browser audio-gesture requirements)

The host must not hard-code layout or copy.

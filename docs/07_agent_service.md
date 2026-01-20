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

## Legacy stub (optional)
For quick local testing, `src/agent/server.js` exposes a minimal A2A-compatible endpoint using
`src/agent/doomfire_agent_plugin.js` (routes array) and `src/agent/service.js`:

- `POST /a2a`
  - Render: `{"type":"renderWidget","widgetId":"com.cozy.doomfire.live","params":{"mode":"interactive","seed":1337}}`
  - Event: `{"type":"event","event":{"type":"fire.applySettings","payload":{...}}}`
- `POST /event`
  - Event only: `{"event":{"type":"fire.applySettings","payload":{...}}}`
- `GET /health` for readiness probes.

Responses are JSON:
- Render returns `{ "ok": true, "messages": [ ...A2UI messages... ] }`.
- Event returns `{ "ok": true, "messages": [ ...A2UI dataModelUpdate messages... ] }`.

## ElizaOS project (real agent)
The real ElizaOS agent lives in `agent/eliza-develop/packages/project-cozy-doomfire`.
It registers plugin routes via a `routes` array and runs under the ElizaOS server
via `agent/eliza-develop/packages/project-cozy-doomfire/src/server.ts`.
Start it with:
`cd agent/eliza-develop/packages/project-cozy-doomfire && bun run start -- --port 4174`.

Routes are namespaced by plugin name (`cozy-doomfire`), so the endpoints are:
- `POST /cozy-doomfire/a2a` (renderWidget or event)
- `POST /cozy-doomfire/event` (event-only)
- `GET /cozy-doomfire/health`

Playwright starts the ElizaOS server on port 4174 and points the host at
`http://127.0.0.1:4174/cozy-doomfire/a2a`.

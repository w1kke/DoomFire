# 04 — Widget contract: `com.cozy.doomfire.live`

## Summary
A single LiveWidget that renders a cozy pixel fire (DOOM algorithm) with staged controls.

- The **agent** authors all UI layout and narration.
- The **host** renders UI using allowlisted catalogs and runs the DoomFire simulation locally.

## Surfaces
- Preview: `preview` (single surface, sandboxed)
- Live: `main` (single surface)

## Inputs (manifest `inputs` schema)
```json
{
  "type": "object",
  "required": ["mode"],
  "properties": {
    "mode": {"enum": ["interactive"]},
    "seed": {"type": "integer", "minimum": 0, "maximum": 2147483647}
  },
  "additionalProperties": false
}
```

## Events (host → agent)

### E1: `fire.applySettings`
Sent when the user presses **Ignite**.

Payload:
```json
{
  "presetId": "cozy_amber",
  "size": 0.8,
  "intensity": 0.65,
  "heat": 0.6
}
```

Validation rules:
- `presetId` must be in allowlist.
- `size/intensity/heat` are floats in [0, 1].

### E2: `fire.setAudioEnabled`
Used to satisfy browser audio gesture requirements.

Payload:
```json
{ "enabled": true }
```

## State model (agent → host)
The agent maintains both staged and applied settings.

```json
{
  "staged": { "presetId": "cozy_amber", "size": 0.8, "intensity": 0.6, "heat": 0.6 },
  "applied": { "presetId": "cozy_amber", "size": 0.7, "intensity": 0.5, "heat": 0.5 },
  "audioEnabled": false,
  "narration": {
    "phase": "idle",
    "text": "Ready when you are.",
    "stepIndex": 0
  }
}
```

## Presets
Ship a handful of deterministic color palettes:
- `cozy_amber`
- `copper_blue`
- `mystic_violet`
- `neon_lime`
- `rose_quartz`
- `ghost_flame`

## Narration choreography
Agent emits narration updates that reflect progress/latency.

Recommended phases:
- `collecting`
- `stacking`
- `striking`
- `burning`

Notes:
- Phase timing can be driven by actual agent processing + host acknowledgements.
- Host must treat narration as non-authoritative UI copy (no privileged actions).

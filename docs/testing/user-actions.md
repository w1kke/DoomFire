# User actions

This document inventories every user action in the current Cozy DoomFire host UI and the expected behavior.

## Preview
- Open Live ("Open" button): explicit user click sends a live start request; on success, LIVE badge appears and live UI renders; on failure, show Agent unavailable and keep live controls hidden.
- Retry Open after failure: re-attempts live start; stays in preview until the agent responds successfully.

## Live controls
- Preset buttons: update staged preset and selection highlight; no agent event until Ignite; applied state stays unchanged.
- Size slider: updates staged size value and readout; no agent event until Ignite.
- Intensity slider: updates staged intensity value and readout; no agent event until Ignite.
- Heat slider: updates staged heat value and readout; no agent event until Ignite.
- Audio toggle ON: explicit user click enables audio and starts playback; audio remains opt-in.
- Audio toggle OFF: stops playback; audio stays disabled until re-enabled by a user click.
- Ignite: sends exactly one `fire.applySettings` event with staged values; narration advances through phases; applied state matches staged when the agent finishes; fire transitions locally.
- Reset: restores staged settings to the default values from the initial live render; applied state stays unchanged until the next Ignite.

## Error recovery
- Agent unavailable: show error message, hide LIVE badge, and do not render live controls. User can click Open again to retry.

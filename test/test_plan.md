# Test plan

This test plan is intentionally derived from the broader A2UI security test discipline, but scoped to this single widget.

## Conventions
- IDs: `DF-VAL-*`, `DF-SBX-*`, `DF-LIVE-*`, `DF-FX-*`, `DF-AUD-*`.

## DF-VAL — Manifest & bundle validation
### DF-VAL-001 Reject non-JSON manifest
- Input: bytes not valid JSON
- Expected: structured error, safe fallback

### DF-VAL-002 Reject missing required fields
- Input: missing `type` or `manifestVersion` or `widgets`
- Expected: rejected

### DF-VAL-003 Reject preview bundle targetting surface != `preview`
- Input: bundle uses `surfaceId: "main"`
- Expected: rejected

## DF-SBX — Preview sandbox
### DF-SBX-001 Preview triggers zero network requests
- Render preview that contains any remote URL props
- Expected: 0 requests initiated by payload; placeholders shown

### DF-SBX-002 Preview blocks external navigation
- Render preview with an action that attempts open-url
- Expected: blocked

## DF-LIVE — Live session
### DF-LIVE-001 Engage is gated
- Attempt to start live session without user click
- Expected: denied

### DF-LIVE-002 Surface allowlist enforced
- Stream update to surfaceId not in contract
- Expected: blocked and logged

### DF-LIVE-003 Event allowlist enforced
- Attempt to send event type not in widget contract
- Expected: blocked

## DF-FX — DoomFire determinism
### DF-FX-001 Deterministic framebuffer hash
- Render 300 frames with same seed/settings
- Expected: final framebuffer digest unchanged between runs

## DF-AUD — Audio
### DF-AUD-001 Autoplay guard
- Load widget; do not click enable
- Expected: audio context remains suspended / muted

### DF-AUD-002 Loop click-free
- Let audio loop
- Expected: no clicks (fade at loop boundary)

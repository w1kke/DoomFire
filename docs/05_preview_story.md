# 05 — Preview strategy (advertising)

Previews matter because they show up in:
- agent overview pages
- galleries / curated lists
- social cards

## Preview requirements
- Must render without starting a live agent session.
- Must be safe by default:
  - single surface only (`preview`)
  - no network fetches triggered by payload
  - no external navigation
  - no wallet intents
- Must communicate the vibe:
  - title + short tagline
  - an “Open” CTA
  - a tiny animated-ish cue is optional (but preview bundles are static)

## Preview payload format
Per UI Manifest v2, the preview payload is an **A2UI message bundle** containing the messages needed to:
1) create a `preview` surface UI
2) begin rendering

See `artifacts/preview-bundle.json`.

## Thumbnail
Even with an inline preview bundle, a thumbnail is recommended for fast lists.

- Format: `image/webp` preferred
- URI: `ipfs://...` preferred

For the prototype you can omit thumbnail and rely on the preview bundle.

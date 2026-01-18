# 03 — UI Manifest v2 (implementation guide)

This prototype uses the **UI Manifest v2 draft** shape as the pre-session, crawlable artifact for discovery and safe previews.

Key properties of v2 (why we use it):
- Correct A2UI extension identifier (not a docs URL)
- Preview payloads are **A2UI message bundles** (not an invented tree)
- Stronger safety defaults and integrity hooks

## Required fields
At top level:
- `type`: `https://eips.ethereum.org/EIPS/eip-8004#ui-manifest-v2`
- `manifestVersion`: `"2"`
- `agentRegistry`: `eip155:84532:0x7177a6867296406881E20d6647232314736Dd09A`
- `agentId`: string
- `updatedAt`: RFC3339 datetime
- `a2ui`: binding
- `widgets`: non-empty

## A2UI binding (`a2ui`)
- `version`: `"0.8"`
- `a2aExtensionUri`: `https://a2ui.org/a2a-extension/a2ui/v0.8`
- `dataPartMimeType`: `application/json+a2ui`
- `supportedCatalogIds`: include standard catalog + your custom fireplace catalog
- `acceptsInlineCatalogs`: false (recommended)

## Widget record (our LiveWidget)
We ship exactly one:
- `id`: `com.cozy.doomfire.live`
- `kind`: `live`
- `surfaceContract`: single surface `main`
- `inputs`: minimal, but include `mode` and `seed`
- `preview`: **required** (for advertising)
- `invocation`: kind `a2a` with request `{ type: "renderWidget", widgetId, params }`

## Preview bundle rules
Preview bundles MUST:
- target only `preview` surface
- contain no wallet intents
- contain no external links
- not require network fetches

The preview payload can be either:
- `inlineMessageBundle` (embed `messages[]` directly)
- `messageBundleUri` (URI to a bundle on IPFS)

For this prototype, prefer **inline** to keep the number of moving pieces low.

## Files
See:
- `artifacts/ui-manifest.v2.json`
- `artifacts/preview-bundle.json`

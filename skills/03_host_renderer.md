# Skill: A2UI Host website

## Responsibilities
- Resolve ERC-8004 pointer chain.
- Validate and cache the UI manifest.
- Render preview bundle in strict sandbox.
- Start live session (A2A + A2UI extension).
- Dispatch allowlisted events.

## Non-negotiable safety
- Never install catalogs from the network.
- Never execute code from A2UI payloads.
- Preview mode: no network, no external links, no wallet intents, single surface.

## Implementation steps
1. Create an A2UI renderer with:
   - Standard catalog components
   - Custom `DoomFireCanvas` component
2. Implement a `ManifestLoader` with JSON schema validation.
3. Implement preview rendering:
   - only `surfaceId=preview`
   - ignore/deny unknown message types
4. Implement engage flow:
   - explicit click required
   - show LIVE badge
   - event allowlist

## Tests
- network blocking in preview
- caps enforcement
- event allowlist enforcement

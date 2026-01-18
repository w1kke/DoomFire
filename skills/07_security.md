# Skill: Security gates (Preview sandbox)

## Preview sandbox checklist
- Surface allowlist: only `preview`.
- No network side effects:
  - block remote images/fonts triggered by payload
  - verify 0 outbound requests during preview render
- No external navigation.
- No wallet intents.
- Payload caps: bytes, component count, nesting depth, string lengths.
- Deny-by-default action dispatch.

## Engage-mode checklist
- explicit user confirmation before starting live session
- LIVE badge + identity label visible
- event allowlist enforced
- rate limit and terminate on abuse

## Implementation guidance
Use `test/test_vectors/` and add new vectors for each bug.

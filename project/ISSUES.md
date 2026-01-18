# Suggested GitHub issues (spec/test-driven)

## Epic A — Discovery + preview
1. **(A1) Parse UI Manifest v2 + validate**
   - Acceptance: DF-VAL-001/002 pass.
2. **(A2) Render preview bundle in sandbox**
   - Acceptance: AC-001/002 pass.
   - Tests: DF-SBX-001/002 pass.

## Epic B — ERC-8004 pointer chain (Base Sepolia)
3. **(B1) Read tokenURI from IdentityRegistry**
4. **(B2) Fetch agent card from IPFS**
5. **(B3) Resolve A2UI_MANIFEST endpoint**
   - Acceptance: AC-003 pass.

## Epic C — Live session
6. **(C1) A2A session start (gated)**
7. **(C2) A2UI renderer integration**
8. **(C3) Enforce surface/event allowlists**
   - Acceptance: AC-004/005 pass.

## Epic D — DoomFireCanvas
9. **(D1) Implement DOOM fire simulation**
10. **(D2) Parameter mapping + deterministic tests**
    - Acceptance: AC-008 pass.

## Epic E — Audio
11. **(E1) Loop crackle audio with gesture gating**
12. **(E2) Volume mapping**
    - Acceptance: AC-009 pass.

## Epic F — Agent behavior
13. **(F1) Implement renderWidget → full A2UI layout**
14. **(F2) Implement Ignite choreography and narration**
    - Acceptance: AC-006/007 pass.

## Epic G — Deployment validation
15. **(G1) ElizaCloud feasibility spike**
16. **(G2) VM fallback docker-compose**
    - Acceptance: AC-010 pass.

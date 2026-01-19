# Traceability matrix (Requirements → Acceptance → Tests)

| Requirement | Acceptance criteria | Tests |
|---|---|---|
| R1 ERC-8004 discovery | AC-003 | DF-VAL-002 (manifest), plus resolver unit test for tokenURI + agent card + manifest |
| R2 UI Manifest v2 | AC-001, AC-003 | DF-VAL-001, DF-VAL-002 |
| R3 Preview rendering | AC-001, AC-002 | DF-SBX-001, DF-SBX-002, DF-VAL-003 |
| R4 Live session rendering | AC-004, AC-005 | DF-LIVE-001, DF-LIVE-002 |
| R5 Interaction model | AC-006, AC-007 | DF-LIVE-003 + Ignite/narration unit tests |
| R6 Visual+audio | AC-008, AC-009 | DF-FX-001, DF-AUD-001, DF-AUD-002 |

Notes:
- DF-VAL-003 implemented as a unit test for preview surface allowlist.
- DF-SBX-001/002 implemented as preview sandbox unit tests (external link, wallet, network).
- AC-001 preview render from manifest covered by manifest loader tests.
- AC-003 pointer chain covered by ERC-8004 resolver + RPC chain reader tests with mocked fetch.
- DF-LIVE-001/002/003 covered by live session unit tests (gating, surfaces, events).
- AC-006/007 covered by ignite flow + agent narration tests.
- DF-FX-001 covered by doomfire deterministic hash test.
- DF-AUD-001/002 covered by audio controller gesture + loop envelope tests.
- AC-010 documented via deployment_check.json and elizacloud check test.
- Playwright E2E tests cover preview render, sandbox fallback, and live gating.
- Playwright E2E covers control staging + Ignite payload for live settings.
- Playwright E2E covers audio gesture gating via Audio toggle.

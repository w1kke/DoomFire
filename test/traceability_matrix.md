# Traceability matrix (Requirements → Acceptance → Tests)

| Requirement | Acceptance criteria | Tests |
|---|---|---|
| R1 ERC-8004 discovery | AC-003 | DF-VAL-002 (manifest), plus resolver unit test for tokenURI + agent card + manifest |
| R2 UI Manifest v2 | AC-001, AC-003 | DF-VAL-001, DF-VAL-002 |
| R3 Preview rendering | AC-001, AC-002 | DF-SBX-001, DF-SBX-002, DF-VAL-003, Playwright: "Preview renders safely", "Preview sandbox shows fallback on disallowed payload" |
| R4 Live session rendering | AC-004, AC-005 | DF-LIVE-001, DF-LIVE-002, DF-LIVE-004, Playwright: "No agent => no live UI", "Ignite applies settings and changes the fire palette" |
| R5 Interaction model | AC-006, AC-007 | DF-LIVE-003 + Ignite/narration unit tests + DF-AGENT-001, Playwright: "Ignite applies settings and changes the fire palette", "Reset returns to defaults" |
| R5 Interaction model | AC-006, AC-007 | DF-LIVE-003 + Ignite/narration unit tests, Playwright: "Ignite applies settings and changes the fire palette" |
| R6 Visual+audio | AC-008, AC-009 | DF-FX-001, DF-AUD-001, DF-AUD-002, Playwright: "Audio is opt-in and toggle works" |

Notes:
- DF-VAL-003 implemented as a unit test for preview surface allowlist.
- DF-SBX-001/002 implemented as preview sandbox unit tests (external link, wallet, network).
- AC-001 preview render from manifest covered by manifest loader tests.
- AC-003 pointer chain covered by ERC-8004 resolver + RPC chain reader tests with mocked fetch.
- DF-LIVE-001/002/003 covered by live session unit tests (gating, surfaces, events).
- DF-LIVE-004 covered by agent client unit test + Playwright live session tests (agent endpoint via `agent/eliza-develop/packages/project-cozy-doomfire/src/server.ts`, unreachable agent handling, Ignite palette hash change).
- DF-AGENT-001 covered by ElizaOS plugin unit test in `agent/eliza-develop/packages/project-cozy-doomfire/src/__tests__/plugin.test.ts`.
- Agent session scoping covered by ElizaOS plugin unit test using `sessionId`.
- AC-006/007 covered by ignite flow + agent narration tests.
- DF-FX-001 covered by doomfire deterministic hash test.
- DF-AUD-001/002 covered by audio controller gesture + loop envelope tests.
- AC-010 documented via deployment_check.json and elizacloud check test.
- Playwright E2E tests cover preview render, sandbox fallback, and live gating (see named tests above).
- Playwright E2E covers control staging + Ignite payload for live settings via "Ignite applies settings and changes the fire palette".
- Playwright E2E covers audio gesture gating via "Audio is opt-in and toggle works".

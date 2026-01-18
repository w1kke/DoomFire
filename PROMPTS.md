# PROMPTS.md - Copy/paste prompts for Codex + a RALPH loop

These prompts are designed to keep development spec-driven and prevent scope creep.

Before using any prompt:
- Read `AGENTS.md`
- Read `test/acceptance_criteria.md`

---

## Prompt 0 - Bootstrap (run once at the beginning)

You are a senior full-stack engineer working in a spec/test-driven repo.

GOAL: Implement the Cozy DoomFire prototype described by the markdown specs in this repo.

NON-NEGOTIABLE RULES:
- Follow `AGENTS.md` exactly.
- Do not add features that are out of scope (payments, streaming, deep chat, wallet intents, external links).
- The agent must fully author the A2UI UI. The host must not hard-code widget layout.
- Preview sandbox is strict: single surface `preview`, no network, no external links, no wallet intents.
- Determinism is required for the DoomFire renderer.

FIRST ACTIONS:
1) Read: `AGENTS.md`, `docs/00_overview.md`, `docs/01_requirements.md`, `docs/02_architecture.md`, `test/acceptance_criteria.md`, `skills/00_build_order.md`.
2) Produce a short implementation plan mapped to PR0..PR7 (from `skills/00_build_order.md`).
3) Start with PR0 and PR1 only. Keep PRs small.
4) For PR0/PR1:
   - write tests first,
   - implement the minimal code to pass those tests,
   - run the full test suite.

OUTPUT FORMAT:
- A checklist of PRs to do next.
- Then proceed to implement PR0.

---

## Prompt 1 - PR template prompt (use for each PR)

You are implementing ONE small milestone in this repo.

PR SCOPE:
- Target exactly one acceptance criterion (or a small part of one).
- Do not modify unrelated files.

REQUIREMENTS:
- Add or update automated tests.
- Update acceptance criteria status / traceability notes.
- Keep preview sandbox rules intact.

PROCESS:
1) Identify which acceptance criterion you are addressing.
2) Add a failing test that captures the desired behavior.
3) Implement the smallest change to make the test pass.
4) Run all tests.
5) Summarize what changed and why.

---

## Prompt 2 - RALPH loop controller (infinite loop until done)

You are running an iterative dev loop until all acceptance criteria pass.

LOOP STEPS:
1) Run the full test suite.
2) If tests fail:
   - summarize failures in 5-10 lines,
   - map each failure to the most relevant acceptance criterion,
   - pick the single highest-leverage fix,
   - implement the minimal code change,
   - add/update a test if coverage is missing,
   - go back to step 1.
3) If tests pass:
   - verify each acceptance criterion in `test/acceptance_criteria.md` is truly satisfied (not just "green tests").
   - If any AC is not satisfied, add a missing test and continue looping.

STOP CONDITION:
- Stop ONLY when:
  - all tests pass, and
  - all acceptance criteria are satisfied.

STRICT RULES:
- Do not add new features to "make tests easier".
- If something is underspecified, implement the safest minimal behavior and document the assumption.

---

## Prompt 3 - Debugging a failing test (surgical fix)

A test is failing. Fix it with the smallest possible change.

RULES:
- Do not weaken security policy.
- Do not change acceptance criteria.
- Prefer fixing the implementation over changing the test, unless the test is clearly wrong.

PROCESS:
1) Explain the likely root cause.
2) Show the minimal diff to fix it.
3) Run tests again.

---

## Prompt 4 - Security hardening pass (after PR6)

Perform a security review focused on Preview and Engage mode.

CHECKLIST:
- Preview: single surface only, no widget-triggered network, no external navigation, deny-by-default actions.
- Engage: explicit confirmation before session start, LIVE badge, surface allowlist, event allowlist, update rate caps.
- Unknown components/messages are rejected or safely ignored.
- No secrets logged.

ACTION:
- Add any missing negative test vectors to `test/test_vectors/`.
- Add tests that ensure violations fail closed.

---

## Prompt 5 - ElizaCloud feasibility check (AC-010)

Goal: satisfy AC-010.

TASK:
- Determine whether the ElizaCloud deployment path can run the custom code/plugins and expose the required behavior for A2A + A2UI.

OUTPUT:
- If YES: document exactly how to deploy and which endpoints/commands are available.
- If NO or uncertain: implement and document the fallback VM plan.

DO NOT GUESS. Make the check explicit and verifiable.

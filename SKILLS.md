# SKILLS.md - Required tools and "tool calls" for building this prototype

This repo is designed to be implemented by AI coding agents (Codex) and humans.

The detailed task breakdown lives in `skills/`. This file describes the minimal capability set the coding agent needs in order to execute those tasks end-to-end.

## 1. Core required capabilities (non-negotiable)

1) Read repo files
- Open and read markdown specs in `docs/`, `test/`, and `skills/`.
- Inspect JSON artifacts in `artifacts/`.

2) Write / edit repo files
- Create new source files.
- Update existing docs + test vectors.

3) Run shell commands
- Install dependencies.
- Run linters/formatters.
- Run unit/integration tests.
- Start dev servers.

4) Git operations
- Create branches.
- Commit small diffs.
- Open PRs.
- Update PR descriptions with the PR checklist.

5) Determinism verification
- Capture framebuffer output from the DoomFire renderer.
- Hash it deterministically.
- Compare hashes in automated tests.

## 2. Optional but strongly recommended capabilities

6) Web lookup
- Only for non-guessable details (A2UI spec nuance, ElizaOS integration details, Base Sepolia RPC quirks).
- Prefer primary docs.

7) EVM / Base Sepolia interaction
- Ability to call read-only RPC methods.
- Ability to send a transaction when the human provides a private key (never commit secrets).

8) IPFS publishing
- Add/pin the `artifacts/` directory.
- Return stable `ipfs://` URIs.

9) Audio processing
- Download a crackle audio file.
- Convert it to a web-friendly format (mp3 is acceptable for v0; ogg/webm optional).

## 3. Suggested concrete command toolbox (update when code exists)

These commands are suggestions. The repo should add real scripts as code lands.

### Node / web host
- Install: `npm install`
- Dev: `npm run dev`
- Test: `npm test`
- Lint: `npm run lint`
- Format: `npm run format`

### JSON validation
- Use a schema validator (e.g., ajv) in tests.
- Validate:
  - UI manifest v2
  - preview bundle
  - event payloads

### IPFS
- Publish artifacts directory:
  - `ipfs add -r artifacts`

### Base Sepolia (Foundry)
- Call tokenURI:
  - `cast call <IdentityRegistryAddress> "tokenURI(uint256)(string)" <agentId> --rpc-url https://sepolia.base.org`
- Register agent (human runs this):
  - `cast send <IdentityRegistryAddress> "register(string)" "ipfs://.../agent-card.registration.json" --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY`

### Audio conversion
- If needed:
  - `ffmpeg -i input.mp3 -c:a libvorbis output.ogg`

## 4. "Tool calls" for an automated loop (RALPH-friendly)

If you are using an agentic loop runner (like your RALPH skill), the loop should have these primitive actions:

- READ(path)
- WRITE(path, contents)
- RUN(cmd)
- SEARCH(query)
- TEST() -> runs the full test suite
- REPORT() -> summarizes failing tests + maps them to acceptance criteria

The loop MUST stop only when:
- all automated tests pass, AND
- all acceptance criteria in `test/acceptance_criteria.md` are satisfied.


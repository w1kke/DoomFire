# 02 — Architecture

## Components

### 1) Base Sepolia (on-chain)
- **ERC-8004 IdentityRegistry**: stores agent handles and their `tokenURI(agentId)`.

### 2) Off-chain static artifacts (IPFS)
- **Agent card / registration file** (JSON)
- **UI Manifest v2** (JSON)
- **Preview bundle** (JSON, optional: inline in manifest)
- **Thumbnail** (optional)

### 3) Live runtime
- **A2UI Host website**
  - resolves pointer chain
  - renders preview bundles
  - opens live A2A session
  - runs a local Canvas/WebGL DoomFire renderer + WebAudio
- **ElizaOS agent**
  - receives `renderWidget`
  - streams A2UI messages
  - validates and applies `fire.applySettings`
  - emits narration progression

## Pointer chain (discovery)

```text
Base Sepolia: IdentityRegistry(tokenURI(agentId))
  -> ipfs://<CID>/agent-card.json
    -> endpoints[].A2UI_MANIFEST = ipfs://<CID>/ui-manifest.json
      -> widgets[] include preview bundle + live invocation contract
```

## Runtime data flow

### Preview (no session)
1. Host loads manifest.
2. Host renders `widgets[].preview` bundle in a strict sandbox.

### Live (A2A session)
1. User clicks Open.
2. Host starts session with A2UI extension.
3. Host sends `renderWidget(widgetId, params)`.
4. Agent replies with a message stream:
   - `surfaceUpdate` + `dataModelUpdate` + `beginRendering`
5. User adjusts settings, clicks Ignite.
6. Host sends `fire.applySettings` event.
7. Agent emits narration steps + final state.
8. Host applies state to DoomFire renderer and animates transition.

## Where determinism lives
- DoomFire renderer is deterministic by design.
- Agent is responsible for producing a deterministic `appliedSettings` object.
- Host should maintain a `seed` value (fixed unless explicitly changed) so visuals remain reproducible.

## Deployment modes
- **Preferred:** ElizaOS Cloud deploy of a full agent project (code + routes).
- **Fallback:** VM-hosted agent + static files served via a small web server.

See `docs/11_deployment_options.md`.

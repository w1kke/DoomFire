const assert = require("node:assert/strict");
const { test } = require("node:test");

const { createLiveSession } = require("../../src/host/live_session.js");

function makeWidget() {
  return {
    id: "com.cozy.doomfire.live",
    surfaceContract: { mode: "single", surfaceIds: ["main"] },
    events: [{ type: "fire.applySettings" }],
  };
}

test("live session requires explicit user action", () => {
  const session = createLiveSession({ widget: makeWidget() });

  const denied = session.start({ userInitiated: false });
  assert.equal(denied.ok, false);
  assert.equal(session.isLive(), false);
});

test("live session shows LIVE badge when started", () => {
  const session = createLiveSession({ widget: makeWidget() });

  const started = session.start({ userInitiated: true });
  assert.equal(started.ok, true);
  assert.equal(session.isLive(), true);
  assert.equal(session.isLiveBadgeVisible(), true);
});

test("surface allowlist enforced in live updates", () => {
  const session = createLiveSession({ widget: makeWidget() });
  session.start({ userInitiated: true });

  const denied = session.applyMessage({
    surfaceUpdate: { surfaceId: "preview", components: [] },
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "surface_not_allowed");

  const allowed = session.applyMessage({
    surfaceUpdate: {
      surfaceId: "main",
      components: [{ id: "root", component: { Text: { text: { literalString: "Hi" } } } }],
    },
  });
  assert.equal(allowed.ok, true);
});

test("event allowlist enforced for host dispatch", () => {
  const session = createLiveSession({ widget: makeWidget() });
  session.start({ userInitiated: true });

  const allowed = session.dispatchEvent({ type: "fire.applySettings", payload: {} });
  assert.equal(allowed.ok, true);

  const denied = session.dispatchEvent({ type: "wallet.send", payload: {} });
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "event_not_allowed");
});

test("live UI is authored by messages", () => {
  const session = createLiveSession({ widget: makeWidget() });
  session.start({ userInitiated: true });

  const before = session.getSurface("main");
  assert.equal(before, null);

  session.applyMessage({
    surfaceUpdate: {
      surfaceId: "main",
      components: [{ id: "root", component: { Text: { text: { literalString: "Hi" } } } }],
    },
  });
  session.applyMessage({
    beginRendering: { surfaceId: "main", root: "root" },
  });

  const after = session.getSurface("main");
  assert.equal(after.rootId, "root");
  assert.ok(after.components.root);
});

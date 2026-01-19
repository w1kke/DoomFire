const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createAudioController,
  buildLoopEnvelope,
} = require("../../src/audio/audio_controller.js");

test("audio does not start until explicitly enabled", () => {
  const controller = createAudioController();

  const before = controller.start();
  assert.equal(before.ok, false);
  assert.equal(controller.getState().playing, false);

  controller.enable();
  const after = controller.start();
  assert.equal(after.ok, true);
  assert.equal(controller.getState().playing, true);
});

test("loop envelope fades in and out to avoid clicks", () => {
  const envelope = buildLoopEnvelope({ durationMs: 2000, fadeMs: 50 });

  assert.equal(envelope[0].gain, 0);
  assert.equal(envelope[envelope.length - 1].gain, 0);
  assert.ok(envelope.some((point) => point.gain === 1));
});

const assert = require("node:assert/strict");
const { test } = require("node:test");

const { respondToIgnite } = require("../../src/agent/ignite_responder.js");

const event = {
  type: "fire.applySettings",
  payload: {
    presetId: "cozy_amber",
    size: 0.8,
    intensity: 0.6,
    heat: 0.7,
  },
};

test("respondToIgnite returns narration phases and final applied state", () => {
  const updates = respondToIgnite({ event });

  const phases = updates
    .map((update) => update.narration && update.narration.phase)
    .filter(Boolean);

  assert.ok(new Set(phases).size >= 3);
  assert.deepEqual(updates[updates.length - 1].applied, event.payload);
});

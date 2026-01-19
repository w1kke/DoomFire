const assert = require("node:assert/strict");
const { test } = require("node:test");

const { createIgniteController } = require("../../src/host/ignite_flow.js");
const { respondToIgnite } = require("../../src/agent/ignite_responder.js");

const initialSettings = {
  presetId: "cozy_amber",
  size: 0.7,
  intensity: 0.5,
  heat: 0.6,
};

test("staged control updates do not dispatch events", () => {
  let dispatchCount = 0;
  const controller = createIgniteController({
    initialSettings,
    dispatchEvent: () => {
      dispatchCount += 1;
    },
  });

  controller.updateStaged({ intensity: 0.8 });
  controller.updateStaged({ heat: 0.4 });

  assert.equal(dispatchCount, 0);
});

test("ignite dispatches exactly one fire.applySettings event", () => {
  const events = [];
  const controller = createIgniteController({
    initialSettings,
    dispatchEvent: (event) => events.push(event),
  });

  controller.updateStaged({ intensity: 0.9 });
  const event = controller.ignite();

  assert.equal(events.length, 1);
  assert.equal(events[0].type, "fire.applySettings");
  assert.equal(event.type, "fire.applySettings");
  assert.equal(event.payload.intensity, 0.9);
});

test("narration progresses through at least three phases", () => {
  const controller = createIgniteController({
    initialSettings,
    dispatchEvent: () => {},
  });

  const igniteEvent = controller.ignite();
  const updates = respondToIgnite({ event: igniteEvent });

  updates.forEach((update) => controller.applyAgentUpdate(update));

  const phases = updates
    .map((update) => update.narration && update.narration.phase)
    .filter(Boolean);
  const uniquePhases = new Set(phases);

  assert.ok(uniquePhases.size >= 3);
  assert.deepEqual(controller.getState().applied, igniteEvent.payload);
});

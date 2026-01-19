const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { test } = require("node:test");

const {
  createFireSimulation,
  stepSimulation,
  renderFrame,
} = require("../../src/doomfire/renderer.js");

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

test("doomfire renderer produces deterministic framebuffer hash", () => {
  const settings = {
    presetId: "cozy_amber",
    size: 0.7,
    intensity: 0.6,
    heat: 0.5,
    seed: 1337,
  };

  const simA = createFireSimulation(settings);
  const simB = createFireSimulation(settings);

  for (let i = 0; i < 300; i += 1) {
    stepSimulation(simA);
    stepSimulation(simB);
  }

  const hashA = hashBuffer(renderFrame(simA));
  const hashB = hashBuffer(renderFrame(simB));

  assert.equal(hashA, hashB);
});

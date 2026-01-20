const assert = require("node:assert/strict");
const { test } = require("node:test");

const { createLiveUpdateGate } = require("../../src/host/live_update_gate.js");

test("live update gate allows small batches", () => {
  const gate = createLiveUpdateGate({
    maxUpdatesPerSec: 5,
    maxUpdatesPerBatch: 3,
    maxBatchBytes: 1024,
    now: () => 1000,
  });

  const result = gate.consume([{ applied: { presetId: "cozy_amber" } }]);
  assert.equal(result.ok, true);
});

test("live update gate rejects oversized batches", () => {
  const gate = createLiveUpdateGate({ maxUpdatesPerBatch: 2, now: () => 1000 });

  const result = gate.consume([{},{},{}]);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "live_update_batch_too_large");
});

test("live update gate rejects oversized payloads", () => {
  const gate = createLiveUpdateGate({ maxBatchBytes: 20, now: () => 1000 });

  const result = gate.consume([{ narration: { text: "A".repeat(100) } }]);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "live_update_payload_too_large");
});

test("live update gate enforces rate limits", () => {
  const gate = createLiveUpdateGate({
    maxUpdatesPerSec: 2,
    maxRateViolations: 2,
    rateWindowMs: 1000,
    now: () => 1000,
  });

  assert.equal(gate.consume([{}]).ok, true);
  assert.equal(gate.consume([{}]).ok, true);

  const limited = gate.consume([{}]);
  assert.equal(limited.ok, false);
  assert.equal(limited.error.code, "rate_limited");

  const exceeded = gate.consume([{}]);
  assert.equal(exceeded.ok, false);
  assert.equal(exceeded.error.code, "rate_limit_exceeded");
});

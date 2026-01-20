const DEFAULT_MAX_LIVE_UPDATES_PER_SEC = 10;
const DEFAULT_RATE_WINDOW_MS = 1000;
const DEFAULT_MAX_RATE_VIOLATIONS = 3;
const DEFAULT_MAX_UPDATES_PER_BATCH = 20;
const DEFAULT_MAX_BATCH_BYTES = 50 * 1024;

function createLiveUpdateGate(options = {}) {
  const maxUpdatesPerSec =
    typeof options.maxUpdatesPerSec === "number"
      ? options.maxUpdatesPerSec
      : DEFAULT_MAX_LIVE_UPDATES_PER_SEC;
  const rateWindowMs =
    typeof options.rateWindowMs === "number" ? options.rateWindowMs : DEFAULT_RATE_WINDOW_MS;
  const maxRateViolations =
    typeof options.maxRateViolations === "number"
      ? options.maxRateViolations
      : DEFAULT_MAX_RATE_VIOLATIONS;
  const maxUpdatesPerBatch =
    typeof options.maxUpdatesPerBatch === "number"
      ? options.maxUpdatesPerBatch
      : DEFAULT_MAX_UPDATES_PER_BATCH;
  const maxBatchBytes =
    typeof options.maxBatchBytes === "number" ? options.maxBatchBytes : DEFAULT_MAX_BATCH_BYTES;
  const now = typeof options.now === "function" ? options.now : Date.now;
  const updateTimestamps = [];
  let rateViolations = 0;

  function consume(updates) {
    if (!Array.isArray(updates)) {
      return {
        ok: false,
        error: { code: "invalid_updates", message: "Updates must be an array" },
      };
    }

    if (updates.length === 0) {
      return { ok: true };
    }

    if (updates.length > maxUpdatesPerBatch) {
      return {
        ok: false,
        error: {
          code: "live_update_batch_too_large",
          message: "Update batch exceeds limit",
        },
      };
    }

    const payloadBytes = measureUpdatesBytes(updates);
    if (payloadBytes !== null && payloadBytes > maxBatchBytes) {
      return {
        ok: false,
        error: {
          code: "live_update_payload_too_large",
          message: "Update payload exceeds size limit",
        },
      };
    }

    const timestamp = now();
    updateTimestamps.push(...Array(updates.length).fill(timestamp));
    const cutoff = timestamp - rateWindowMs;
    while (updateTimestamps.length && updateTimestamps[0] <= cutoff) {
      updateTimestamps.shift();
    }

    if (updateTimestamps.length > maxUpdatesPerSec) {
      rateViolations += 1;
      if (rateViolations >= maxRateViolations) {
        return {
          ok: false,
          error: {
            code: "rate_limit_exceeded",
            message: "Live updates exceeded sustained rate limits",
          },
        };
      }
      return {
        ok: false,
        error: {
          code: "rate_limited",
          message: "Live update rate exceeded",
        },
      };
    }

    rateViolations = 0;
    return { ok: true };
  }

  return {
    consume,
  };
}

function measureUpdatesBytes(updates) {
  try {
    return Buffer.byteLength(JSON.stringify(updates), "utf8");
  } catch (error) {
    return null;
  }
}

module.exports = {
  createLiveUpdateGate,
};

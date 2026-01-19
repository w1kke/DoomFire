function createAudioController({ loopFadeMs = 50 } = {}) {
  let enabled = false;
  let playing = false;
  let volume = 0;

  function enable() {
    enabled = true;
  }

  function disable() {
    enabled = false;
    playing = false;
  }

  function start() {
    if (!enabled) {
      return {
        ok: false,
        error: {
          code: "audio_gesture_required",
          message: "Audio playback requires explicit user gesture",
        },
      };
    }
    playing = true;
    return { ok: true };
  }

  function stop() {
    playing = false;
  }

  function setVolumeFromSettings({ intensity = 0, heat = 0 } = {}) {
    const next = clamp((intensity + heat) / 2, 0, 1);
    volume = next;
    return volume;
  }

  function getState() {
    return {
      enabled,
      playing,
      volume,
      loopFadeMs,
    };
  }

  return {
    enable,
    disable,
    start,
    stop,
    setVolumeFromSettings,
    getState,
  };
}

function buildLoopEnvelope({ durationMs, fadeMs }) {
  const safeDuration = Math.max(0, durationMs || 0);
  const safeFade = Math.max(0, Math.min(fadeMs || 0, safeDuration / 2));

  return [
    { timeMs: 0, gain: 0 },
    { timeMs: safeFade, gain: 1 },
    { timeMs: Math.max(safeDuration - safeFade, safeFade), gain: 1 },
    { timeMs: safeDuration, gain: 0 },
  ];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

module.exports = {
  createAudioController,
  buildLoopEnvelope,
};

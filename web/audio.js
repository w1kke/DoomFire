function createCracklePlayer({ url, loopFadeSeconds = 0.04 } = {}) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let context = AudioContextCtor ? new AudioContextCtor() : null;
  let bufferPromise = null;
  let gainLoop = null;
  let gainVolume = null;
  let enabled = false;
  let playing = false;
  let currentSource = null;
  let volume = 0.5;

  function updateDebugState() {
    if (window.__PLAYWRIGHT__ !== true) {
      return;
    }
    window.__audioState = {
      enabled,
      playing,
      volume,
      contextState: context ? context.state : "unsupported",
    };
  }

  async function enable() {
    if (!context) {
      return { ok: false, error: { code: "audio_unsupported" } };
    }
    enabled = true;
    if (context.state === "suspended") {
      await context.resume();
    }
    updateDebugState();
    return { ok: true };
  }

  async function start() {
    if (!enabled) {
      updateDebugState();
      return { ok: false, error: { code: "audio_gesture_required" } };
    }
    if (playing) {
      return { ok: true };
    }
    if (!context) {
      return { ok: false, error: { code: "audio_unsupported" } };
    }
    if (context.state === "suspended") {
      await context.resume();
    }

    const buffer = await loadBuffer(url, context, () => createSilentBuffer(context));
    ensureGainNodes();
    playing = true;
    updateDebugState();
    scheduleLoop(buffer);
    return { ok: true };
  }

  function stop() {
    playing = false;
    if (currentSource) {
      currentSource.onended = null;
      currentSource.stop();
      currentSource = null;
    }
    updateDebugState();
  }

  function setVolume(nextVolume) {
    volume = clamp(nextVolume, 0, 1);
    if (gainVolume && context) {
      gainVolume.gain.setTargetAtTime(volume, context.currentTime, 0.05);
    }
    updateDebugState();
  }

  function ensureGainNodes() {
    if (!context) {
      return;
    }
    if (!gainLoop) {
      gainLoop = context.createGain();
    }
    if (!gainVolume) {
      gainVolume = context.createGain();
      gainLoop.connect(gainVolume);
      gainVolume.connect(context.destination);
    }
  }

  function scheduleLoop(buffer) {
    if (!playing || !context) {
      return;
    }
    if (currentSource) {
      currentSource.onended = null;
      currentSource.stop();
      currentSource = null;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    const now = context.currentTime;
    const duration = buffer.duration;
    const fade = Math.min(loopFadeSeconds, duration / 2);

    gainLoop.gain.cancelScheduledValues(now);
    gainLoop.gain.setValueAtTime(0, now);
    gainLoop.gain.linearRampToValueAtTime(1, now + fade);
    gainLoop.gain.setValueAtTime(1, now + duration - fade);
    gainLoop.gain.linearRampToValueAtTime(0, now + duration);

    source.connect(gainLoop);
    source.start(now);
    source.stop(now + duration);
    source.onended = () => {
      if (playing) {
        scheduleLoop(buffer);
      }
    };
    currentSource = source;
    updateDebugState();
  }

  updateDebugState();

  return {
    enable,
    start,
    stop,
    setVolume,
    getState() {
      return {
        enabled,
        isPlaying: playing,
        contextState: context ? context.state : "unsupported",
        volume,
      };
    },
  };
}

async function loadBuffer(url, context, fallback) {
  if (!context) {
    return fallback();
  }
  if (!url) {
    return fallback();
  }
  if (!loadBuffer.cache) {
    loadBuffer.cache = new Map();
  }
  if (loadBuffer.cache.has(url)) {
    return loadBuffer.cache.get(url);
  }

  const promise = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Audio fetch failed");
      }
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .catch(() => fallback());

  loadBuffer.cache.set(url, promise);
  return promise;
}

function createNoiseBuffer(context) {
  const duration = 1.2;
  const sampleRate = context.sampleRate || 22050;
  const length = Math.floor(sampleRate * duration);
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);
  let state = 1337;

  for (let i = 0; i < length; i += 1) {
    state = (state * 48271) % 2147483647;
    const r = state / 2147483647;
    let sample = (r * 2 - 1) * 0.25;
    state = (state * 48271) % 2147483647;
    if (state / 2147483647 < 0.02) {
      state = (state * 48271) % 2147483647;
      sample += (state / 2147483647 * 2 - 1) * 0.7;
    }

    channel[i] = sample * fadeEnvelope(i, length, sampleRate, 0.05);
  }

  return buffer;
}

function createSilentBuffer(context) {
  const duration = 1;
  const sampleRate = context.sampleRate || 22050;
  const length = Math.floor(sampleRate * duration);
  const buffer = context.createBuffer(1, length, sampleRate);
  return buffer;
}

function fadeEnvelope(index, length, sampleRate, fadeSeconds) {
  const fadeSamples = Math.floor(sampleRate * fadeSeconds);
  if (index < fadeSamples) {
    return index / fadeSamples;
  }
  if (index > length - fadeSamples) {
    return (length - index) / fadeSamples;
  }
  return 1;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export { createCracklePlayer };

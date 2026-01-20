import { createCanvasRenderer, hashFrameFromSettings } from "./doomfire.js";
import { createCracklePlayer } from "./audio.js";

const CRACKLE_AUDIO_URL = "/artifacts/audio/fireplace-loop-original-noise-178209.mp3";

const previewRoot = document.getElementById("preview-root");
const previewFallback = document.getElementById("preview-fallback");
const liveRoot = document.getElementById("live-root");
const liveBadge = document.getElementById("live-badge");
const liveError = document.getElementById("live-error");

const testMode = typeof window !== "undefined" && window.__PLAYWRIGHT__ === true;

const state = {
  manifestConfig: getManifestConfig(),
  live: false,
  liveSurface: null,
  narration: { phase: "idle", text: "", stepIndex: 0 },
  narrationNode: null,
  fireRenderer: null,
  fireCanvas: null,
  fireSettings: null,
  stagedSettings: null,
  defaultSettings: null,
  fireAnimationId: null,
  audioPlayer: null,
  audioEnabled: false,
};

if (testMode) {
  installTestHook();
}

function installTestHook() {
  window.__doomfireTest = {
    getStaged() {
      return state.stagedSettings ? { ...state.stagedSettings } : null;
    },
    getApplied() {
      return state.fireSettings ? { ...state.fireSettings } : null;
    },
    getNarrationPhase() {
      return state.narration?.phase || "";
    },
    getAudioState() {
      const playerState =
        state.audioPlayer && typeof state.audioPlayer.getState === "function"
          ? state.audioPlayer.getState()
          : null;
      return {
        enabled: state.audioEnabled === true,
        contextState: playerState?.contextState || "uninitialized",
        isPlaying: playerState?.isPlaying === true,
      };
    },
    getCanvasHash() {
      return hashCanvasPixels(state.fireCanvas);
    },
  };
}

async function loadPreview() {
  const query = buildManifestQuery();
  const response = await fetch(
    query ? `/api/preview?${query}` : "/api/preview"
  );
  const data = await response.json();

  if (!data.ok) {
    previewFallback.hidden = false;
    previewRoot.innerHTML = "";
    return;
  }

  previewFallback.hidden = true;
  previewRoot.innerHTML = "";
  const element = renderPlan(data.renderPlan, {
    openLive: handleOpenLive,
  });
  previewRoot.appendChild(element);
}

async function handleOpenLive() {
  if (state.live) {
    return;
  }

  clearLiveError();
  const query = buildManifestQuery();
  let data = null;
  try {
    const requestBody = { userInitiated: true };
    if (state.manifestConfig.agentEndpoint) {
      requestBody.agentEndpoint = state.manifestConfig.agentEndpoint;
    }
    const response = await fetch(
      query ? `/api/live/start?${query}` : "/api/live/start",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );
    data = await response.json();
  } catch (error) {
    resetLiveUi();
    showLiveError({ error: { code: "live_request_failed" } });
    return;
  }
  if (!data.ok) {
    resetLiveUi();
    showLiveError(data);
    return;
  }

  state.live = data.live === true;
  liveBadge.hidden = !data.liveBadge;
  if (data.surface) {
    state.liveSurface = data.surface;
    renderLiveSurface(data.surface);
  }
  syncAudioVolume(state.fireSettings);
}

function resetLiveUi() {
  state.live = false;
  state.liveSurface = null;
  if (state.fireRenderer && typeof state.fireRenderer.stop === "function") {
    state.fireRenderer.stop();
  }
  state.fireRenderer = null;
  state.fireCanvas = null;
  state.fireSettings = null;
  state.stagedSettings = null;
  state.defaultSettings = null;
  state.narration = { phase: "idle", text: "", stepIndex: 0 };
  state.narrationNode = null;
  liveBadge.hidden = true;
  liveRoot.innerHTML = "";
}

function showLiveError(data) {
  if (!liveError) {
    return;
  }
  liveError.hidden = false;
  liveError.textContent = formatLiveError(data);
}

function clearLiveError() {
  if (!liveError) {
    return;
  }
  liveError.hidden = true;
  liveError.textContent = "";
}

function formatLiveError(data) {
  const code = data?.error?.code;
  if (!code) {
    return "Live session unavailable.";
  }
  return `Live session error: ${String(code).replace(/_/g, " ")}`;
}

function renderLiveSurface(surface) {
  liveRoot.innerHTML = "";
  state.fireRenderer = null;
  state.fireSettings = mergeSettings(state.fireSettings, findFireSettings(surface));
  state.stagedSettings = { ...state.fireSettings };
  state.defaultSettings = { ...state.fireSettings };
  state.narration = { phase: "idle", text: "", stepIndex: 0 };
  const element = renderPlan(
    {
      surfaceId: "main",
      rootId: surface.rootId,
      components: surface.components,
    },
    {
      ignite: handleIgnite,
      reset: handleReset,
    }
  );
  liveRoot.appendChild(element);
  state.narrationNode = liveRoot.querySelector('[data-testid="narration-text"]');
  if (state.narrationNode) {
    state.narration.text = state.narrationNode.textContent || "";
  }
}

async function handleIgnite() {
  if (!state.live) {
    return;
  }

  if (state.audioEnabled) {
    ensureAudioPlayer().start();
  }
  const baseSettings = mergeSettings(state.stagedSettings, {});
  const event = {
    type: "fire.applySettings",
    payload: {
      presetId: baseSettings.presetId,
      size: baseSettings.size,
      intensity: baseSettings.intensity,
      heat: baseSettings.heat,
    },
  };

  const response = await fetch("/api/live/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  });

  const data = await response.json();
  if (!data.ok) {
    return;
  }

  if (Array.isArray(data.updates) && state.liveSurface) {
    applyAgentUpdates(data.updates);
  }
}

function handleReset() {
  if (!state.live || !state.defaultSettings) {
    return;
  }
  state.stagedSettings = { ...state.defaultSettings };
  syncControls();
}

function renderPlan(plan, handlers) {
  return renderComponent(plan.rootId, plan.components, handlers);
}

function renderComponent(componentId, components, handlers) {
  const entry = components[componentId];
  if (!entry || typeof entry.component !== "object") {
    const missing = document.createElement("div");
    missing.textContent = "Unsupported component.";
    return missing;
  }

  const [type, props] = Object.entries(entry.component)[0] || [];
  let element = null;

  switch (type) {
    case "Card":
      element = renderCard(props, components, handlers);
      break;
    case "Column":
      element = renderColumn(props, components, handlers);
      break;
    case "Row":
      element = renderRow(props, components, handlers);
      break;
    case "Text":
      element = renderText(props);
      break;
    case "Button":
      element = renderButton(props, handlers);
      break;
    case "Slider":
      element = renderSlider(props);
      break;
    case "DoomFireCanvas":
      element = renderDoomFireCanvas(props);
      break;
    case "Image":
      element = renderImagePlaceholder(props);
      break;
    default: {
      const fallback = document.createElement("div");
      fallback.textContent = `Unsupported component: ${type || "unknown"}`;
      element = fallback;
      break;
    }
  }

  if (element && componentId) {
    element.dataset.componentId = componentId;
    if (!element.dataset.testid) {
      const testId = testIdForComponent(type, componentId, props);
      if (testId) {
        element.dataset.testid = testId;
      }
    }
  }

  return element;
}

function testIdForComponent(type, componentId) {
  if (type === "Text" && componentId === "narration") {
    return "narration-text";
  }
  if (type === "DoomFireCanvas" && componentId === "canvas") {
    return "doomfire-canvas";
  }
  return null;
}

function renderCard(props, components, handlers) {
  const card = document.createElement("div");
  card.className = "card";

  if (props && props.child) {
    card.appendChild(renderComponent(props.child, components, handlers));
  }

  return card;
}

function renderColumn(props, components, handlers) {
  const column = document.createElement("div");
  column.className = "column";
  const children = props?.children?.explicitList;

  if (Array.isArray(children)) {
    children.forEach((childId) => {
      column.appendChild(renderComponent(childId, components, handlers));
    });
  }

  return column;
}

function renderRow(props, components, handlers) {
  const row = document.createElement("div");
  row.className = "row";
  const children = props?.children?.explicitList;

  if (Array.isArray(children)) {
    children.forEach((childId) => {
      row.appendChild(renderComponent(childId, components, handlers));
    });
  }

  return row;
}

function renderText(props) {
  const usage = props?.usageHint || "body";
  const text = props?.text?.literalString || "";
  const element = document.createElement(usage === "h2" ? "h2" : "p");
  element.className = usage === "h2" ? "text--h2" : "text--body";
  element.textContent = text;
  return element;
}

function renderButton(props, handlers) {
  const button = document.createElement("button");
  button.className = "button";
  button.type = "button";
  button.textContent = props?.label?.literalString || "Button";

  const actionType = props?.action?.hostEvent?.type;
  const presetId = props?.action?.hostEvent?.payload?.presetId;
  const testId = testIdForButton(actionType, presetId);
  if (testId) {
    button.dataset.testid = testId;
  }
  if (actionType === "openLive" && handlers?.openLive) {
    button.addEventListener("click", handlers.openLive);
  }
  if (actionType === "ignite" && handlers?.ignite) {
    button.addEventListener("click", handlers.ignite);
  }
  if (actionType === "reset" && handlers?.reset) {
    button.addEventListener("click", handlers.reset);
  }
  if (actionType === "toggleAudio") {
    if (state.audioEnabled) {
      button.classList.add("button--selected");
    }
    button.addEventListener("click", () => {
      toggleAudio(button);
    });
  }
  if (actionType === "setPreset") {
    if (typeof presetId === "string") {
      button.dataset.presetId = presetId;
      if (state.stagedSettings?.presetId === presetId) {
        button.classList.add("button--selected");
      }
      button.addEventListener("click", () => {
        updateStagedSettings({ presetId });
      });
    }
  }

  return button;
}

function testIdForButton(actionType, presetId) {
  switch (actionType) {
    case "openLive":
      return "open-live";
    case "ignite":
      return "ignite-button";
    case "reset":
      return "reset-button";
    case "toggleAudio":
      return "audio-toggle";
    case "setPreset":
      return presetId ? `preset-${presetId}` : null;
    default:
      return null;
  }
}

function renderSlider(props) {
  const wrapper = document.createElement("label");
  wrapper.className = "slider";

  const label = document.createElement("span");
  label.className = "slider__label";
  label.textContent = props?.label?.literalString || "Control";

  const value = document.createElement("span");
  value.className = "slider__value";

  const input = document.createElement("input");
  input.className = "slider__input";
  input.type = "range";
  input.min = typeof props?.min === "number" ? String(props.min) : "0";
  input.max = typeof props?.max === "number" ? String(props.max) : "1";
  input.step = typeof props?.step === "number" ? String(props.step) : "0.01";

  const actionType = props?.action?.hostEvent?.type;
  const controlKey = controlKeyFromAction(actionType);
  const initialValue = getControlInitialValue(controlKey, props?.value);
  input.value = String(initialValue);
  value.textContent = formatSliderValue(initialValue);

  if (controlKey) {
    input.dataset.control = controlKey;
    value.dataset.controlValue = controlKey;
    input.dataset.testid = `control-${controlKey}`;
    value.dataset.testid = `control-${controlKey}-value`;
    input.addEventListener("input", (event) => {
      const nextValue = Number.parseFloat(event.target.value);
      updateStagedSettings({ [controlKey]: nextValue });
      value.textContent = formatSliderValue(nextValue);
    });
  }

  wrapper.appendChild(label);
  wrapper.appendChild(value);
  wrapper.appendChild(input);
  return wrapper;
}

function renderDoomFireCanvas(props) {
  const canvas = document.createElement("canvas");
  canvas.className = "doomfire-canvas";
  canvas.dataset.testid = "doomfire-canvas";
  const settings = mergeSettings(state.fireSettings, props?.appliedSettings);
  state.fireSettings = settings;
  state.stagedSettings = state.stagedSettings || { ...settings };
  state.fireCanvas = canvas;
  canvas.dataset.frameHash = hashFrameFromSettings(settings);
  state.fireRenderer = createCanvasRenderer(canvas, settings);
  return canvas;
}

function renderImagePlaceholder(props) {
  const placeholder = document.createElement("div");
  placeholder.className = "text--body";
  const alt = props?.altText?.literalString || "Image";
  placeholder.textContent = `${alt} (blocked in preview)`;
  return placeholder;
}

function applyAgentUpdates(updates) {
  updates.forEach((update) => {
    if (update && update.applied) {
      applySettingsUpdate(update.applied);
    }
    if (update && update.narration) {
      applyNarrationUpdate(update.narration);
    }
  });
}

function applyNarrationUpdate(narration) {
  state.narration = { ...state.narration, ...narration };
  if (!state.narrationNode) {
    state.narrationNode = liveRoot.querySelector('[data-testid="narration-text"]');
  }
  if (state.narrationNode) {
    state.narrationNode.textContent = state.narration.text || "";
  }
}

function applySettingsUpdate(applied) {
  const nextSettings = mergeSettings(state.fireSettings, applied);
  const previous = state.fireSettings || nextSettings;
  state.fireSettings = nextSettings;
  state.stagedSettings = { ...nextSettings };
  if (state.fireCanvas) {
    state.fireCanvas.dataset.frameHash = hashFrameFromSettings(nextSettings);
  }
  syncControls();
  syncAudioVolume(nextSettings);

  if (!state.fireRenderer) {
    return;
  }

  animateFireTransition(previous, nextSettings);
}

function animateFireTransition(from, to) {
  if (state.fireAnimationId !== null) {
    cancelAnimationFrame(state.fireAnimationId);
  }

  const durationMs = 400;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / durationMs, 1);
    const settings = {
      presetId: to.presetId,
      seed: to.seed,
      size: lerp(from.size, to.size, progress),
      intensity: lerp(from.intensity, to.intensity, progress),
      heat: lerp(from.heat, to.heat, progress),
    };
    state.fireRenderer.updateSettings(settings);

    if (progress < 1) {
      state.fireAnimationId = requestAnimationFrame(step);
    } else {
      state.fireAnimationId = null;
    }
  };

  state.fireAnimationId = requestAnimationFrame(step);
}

function lerp(from, to, t) {
  return from + (to - from) * t;
}

function updateStagedSettings(partial) {
  state.stagedSettings = mergeSettings(state.stagedSettings, partial);
  syncControls();
}

function syncControls() {
  const staged = state.stagedSettings;
  if (!staged) {
    return;
  }

  document.querySelectorAll("input[data-control]").forEach((input) => {
    const key = input.dataset.control;
    if (key && typeof staged[key] === "number") {
      input.value = String(staged[key]);
    }
  });

  document.querySelectorAll("[data-control-value]").forEach((node) => {
    const key = node.dataset.controlValue;
    if (key && typeof staged[key] === "number") {
      node.textContent = formatSliderValue(staged[key]);
    }
  });

  document.querySelectorAll("button[data-preset-id]").forEach((button) => {
    if (button.dataset.presetId === staged.presetId) {
      button.classList.add("button--selected");
    } else {
      button.classList.remove("button--selected");
    }
  });
}

function controlKeyFromAction(actionType) {
  switch (actionType) {
    case "setSize":
      return "size";
    case "setIntensity":
      return "intensity";
    case "setHeat":
      return "heat";
    default:
      return null;
  }
}

function getControlInitialValue(controlKey, fallbackValue) {
  if (controlKey && typeof state.stagedSettings?.[controlKey] === "number") {
    return state.stagedSettings[controlKey];
  }
  if (typeof fallbackValue === "number") {
    return fallbackValue;
  }
  return controlKey === "size" ? 0.7 : 0.6;
}

function formatSliderValue(value) {
  return value.toFixed(2);
}

function hashCanvasPixels(canvas) {
  if (!canvas) {
    return "";
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }
  const width = canvas.width || 0;
  const height = canvas.height || 0;
  if (width === 0 || height === 0) {
    return "";
  }
  const data = context.getImageData(0, 0, width, height).data;
  let hash = 2166136261;
  for (let i = 0; i < data.length; i += 1) {
    hash ^= data[i];
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function mergeSettings(current, next) {
  const base = current || {};
  const incoming = next || {};
  return {
    presetId: typeof incoming.presetId === "string" ? incoming.presetId : base.presetId || "cozy_amber",
    size: typeof incoming.size === "number" ? incoming.size : base.size ?? 0.7,
    intensity: typeof incoming.intensity === "number" ? incoming.intensity : base.intensity ?? 0.6,
    heat: typeof incoming.heat === "number" ? incoming.heat : base.heat ?? 0.6,
    seed: typeof incoming.seed === "number" ? incoming.seed : base.seed ?? 1337,
  };
}

function findFireSettings(surface) {
  const components = surface?.components;
  if (!components || typeof components !== "object") {
    return null;
  }

  for (const entry of Object.values(components)) {
    const component = entry?.component;
    if (!component) {
      continue;
    }
    if (component.DoomFireCanvas?.appliedSettings) {
      return component.DoomFireCanvas.appliedSettings;
    }
  }

  return null;
}

function ensureAudioPlayer() {
  if (!state.audioPlayer) {
    state.audioPlayer = createCracklePlayer({
      url: CRACKLE_AUDIO_URL,
      loopFadeSeconds: 0.04,
    });
  }
  return state.audioPlayer;
}

function syncAudioVolume(settings) {
  if (!settings || !state.audioPlayer || !state.audioEnabled) {
    return;
  }
  const volume = clamp((settings.intensity + settings.heat) / 2, 0, 1);
  state.audioPlayer.setVolume(volume);
}

async function toggleAudio(button) {
  state.audioEnabled = !state.audioEnabled;
  if (state.audioEnabled) {
    const player = ensureAudioPlayer();
    await player.enable();
    await player.start();
    syncAudioVolume(state.fireSettings);
    if (button) {
      button.classList.add("button--selected");
    }
  } else if (state.audioPlayer) {
    state.audioPlayer.stop();
    if (button) {
      button.classList.remove("button--selected");
    }
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getManifestPath() {
  const params = new URLSearchParams(window.location.search);
  return params.get("manifest");
}

function getManifestConfig() {
  const params = new URLSearchParams(window.location.search);
  const agentId = params.get("agentId");
  if (agentId) {
    return {
      agentId,
      agentRegistry: params.get("agentRegistry"),
      manifestPath: null,
      agentEndpoint: params.get("agentEndpoint"),
    };
  }

  return {
    manifestPath: getManifestPath() || "artifacts/ui-manifest.v2.json",
    agentId: null,
    agentRegistry: null,
    agentEndpoint: params.get("agentEndpoint"),
  };
}

function buildManifestQuery() {
  const params = new URLSearchParams();
  if (state.manifestConfig.agentId) {
    params.set("agentId", state.manifestConfig.agentId);
    if (state.manifestConfig.agentRegistry) {
      params.set("agentRegistry", state.manifestConfig.agentRegistry);
    }
    if (state.manifestConfig.agentEndpoint) {
      params.set("agentEndpoint", state.manifestConfig.agentEndpoint);
    }
    return params.toString();
  }
  if (state.manifestConfig.manifestPath) {
    params.set("manifest", state.manifestConfig.manifestPath);
    if (state.manifestConfig.agentEndpoint) {
      params.set("agentEndpoint", state.manifestConfig.agentEndpoint);
    }
    return params.toString();
  }
  if (state.manifestConfig.agentEndpoint) {
    params.set("agentEndpoint", state.manifestConfig.agentEndpoint);
    return params.toString();
  }
  return "";
}

loadPreview();

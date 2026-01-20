const fs = require("node:fs");
const path = require("node:path");

const { respondToIgnite } = require("./ignite_responder.js");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const LIVE_BUNDLE_PATH = path.join(ROOT_DIR, "artifacts", "live-bundle.json");
const WIDGET_ID = "com.cozy.doomfire.live";

const DEFAULT_STATE = Object.freeze({
  staged: {
    presetId: "cozy_amber",
    size: 0.7,
    intensity: 0.6,
    heat: 0.6,
    seed: 1337,
  },
  applied: {
    presetId: "cozy_amber",
    size: 0.7,
    intensity: 0.6,
    heat: 0.6,
    seed: 1337,
  },
  narration: {
    phase: "idle",
    text: "Ready when you are.",
    stepIndex: 0,
  },
});

function createDoomfireAgentPlugin({ initialState } = {}) {
  const state = createInitialState(initialState);

  return {
    name: "doomfire-agent",
    description: "Deterministic A2UI DoomFire agent routes.",
    routes: [
      {
        method: "GET",
        path: "/health",
        handler: async () => ({ ok: true }),
      },
      {
        method: "POST",
        path: "/a2a",
        handler: async ({ body }) => handleA2aRequest(body, state),
      },
      {
        method: "POST",
        path: "/event",
        handler: async ({ body }) => handleEventRequest(body?.event || body, state),
      },
    ],
  };
}

function handleA2aRequest(body, state) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: { code: "invalid_request" } };
  }

  if (body.type === "renderWidget") {
    return handleRenderWidget(body, state);
  }

  if (body.type === "event") {
    return handleEventRequest(body.event, state);
  }

  return { ok: false, error: { code: "unsupported_request" } };
}

function handleRenderWidget(body, state) {
  if (body.widgetId && body.widgetId !== WIDGET_ID) {
    return { ok: false, error: { code: "unknown_widget" } };
  }

  const seed = typeof body.params?.seed === "number" ? body.params.seed : null;
  if (typeof seed === "number") {
    state.applied.seed = seed;
    state.staged.seed = seed;
  }

  const messages = loadLiveBundleMessages(state);
  messages.push({
    dataModelUpdate: {
      dataModelId: "doomfire",
      patch: {
        staged: { ...state.staged },
        applied: { ...state.applied },
        narration: { ...state.narration },
      },
    },
  });

  return { ok: true, messages };
}

function handleEventRequest(event, state) {
  if (!event || typeof event !== "object") {
    return { ok: false, error: { code: "event_missing" } };
  }

  if (event.type === "fire.applySettings") {
    const payload = sanitizeSettings(event.payload, state.applied);
    state.applied = { ...state.applied, ...payload };
    state.staged = { ...state.staged, ...payload };

    const updates = respondToIgnite({
      event: { type: "fire.applySettings", payload },
    });

    const messages = updates.map((update) => ({
      dataModelUpdate: {
        dataModelId: "doomfire",
        patch: buildPatch(update),
      },
    }));

    if (updates.length > 0) {
      const last = updates[updates.length - 1];
      if (last.narration) {
        state.narration = { ...state.narration, ...last.narration };
      }
    }

    return { ok: true, messages };
  }

  if (event.type === "fire.setAudioEnabled") {
    return { ok: true, messages: [] };
  }

  return { ok: false, error: { code: "event_not_supported" } };
}

function buildPatch(update) {
  const patch = {};
  if (update.applied) {
    patch.applied = update.applied;
  }
  if (update.narration) {
    patch.narration = update.narration;
  }
  return patch;
}

function sanitizeSettings(payload, fallback) {
  const base = fallback || {};
  if (!payload || typeof payload !== "object") {
    return { ...base };
  }
  return {
    presetId:
      typeof payload.presetId === "string" ? payload.presetId : base.presetId,
    size: typeof payload.size === "number" ? payload.size : base.size,
    intensity:
      typeof payload.intensity === "number" ? payload.intensity : base.intensity,
    heat: typeof payload.heat === "number" ? payload.heat : base.heat,
    seed: typeof payload.seed === "number" ? payload.seed : base.seed,
  };
}

function loadLiveBundleMessages(state) {
  const raw = fs.readFileSync(LIVE_BUNDLE_PATH, "utf8");
  const bundle = JSON.parse(raw);
  const messages = Array.isArray(bundle.messages) ? bundle.messages : [];

  messages.forEach((message) => {
    const update = message?.surfaceUpdate;
    if (!update || !Array.isArray(update.components)) {
      return;
    }

    update.components.forEach((component) => {
      if (component?.id === "narration") {
        const textNode = component?.component?.Text?.text;
        if (textNode && typeof state.narration?.text === "string") {
          textNode.literalString = state.narration.text;
        }
      }

      const entry = component?.component?.DoomFireCanvas;
      if (!entry || !entry.appliedSettings) {
        return;
      }
      entry.appliedSettings = { ...state.applied };
    });
  });

  return messages;
}

function createInitialState(initialState) {
  if (!initialState) {
    return {
      staged: { ...DEFAULT_STATE.staged },
      applied: { ...DEFAULT_STATE.applied },
      narration: { ...DEFAULT_STATE.narration },
    };
  }
  return {
    staged: { ...DEFAULT_STATE.staged, ...initialState.staged },
    applied: { ...DEFAULT_STATE.applied, ...initialState.applied },
    narration: { ...DEFAULT_STATE.narration, ...initialState.narration },
  };
}

module.exports = {
  createDoomfireAgentPlugin,
};

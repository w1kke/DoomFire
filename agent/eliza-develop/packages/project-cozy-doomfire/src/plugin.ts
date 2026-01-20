import type { IAgentRuntime, Plugin, RouteRequest, RouteResponse } from '@elizaos/core';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WIDGET_ID = 'com.cozy.doomfire.live';
const DATA_MODEL_ID = 'doomfire';
const PRESET_IDS = new Set([
  'cozy_amber',
  'copper_blue',
  'mystic_violet',
  'neon_lime',
  'rose_quartz',
  'ghost_flame',
]);

const DEFAULT_SETTINGS = Object.freeze({
  presetId: 'cozy_amber',
  size: 0.7,
  intensity: 0.6,
  heat: 0.6,
  seed: 1337,
});

const DEFAULT_NARRATION = Object.freeze({
  phase: 'idle',
  text: 'Ready when you are.',
  stepIndex: 0,
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../../../..');
const LIVE_BUNDLE_PATH = path.join(ROOT_DIR, 'artifacts', 'live-bundle.json');

type FireSettings = {
  presetId: string;
  size: number;
  intensity: number;
  heat: number;
  seed: number;
};

type Narration = {
  phase: string;
  text: string;
  stepIndex: number;
};

type AgentState = {
  staged: FireSettings;
  applied: FireSettings;
  narration: Narration;
};

const baseBundle = loadBundle();
const stateBySession = new Map<string, AgentState>();

function loadBundle(): { messages?: unknown[] } {
  const raw = readFileSync(LIVE_BUNDLE_PATH, 'utf8');
  return JSON.parse(raw) as { messages?: unknown[] };
}

function readSessionId(req: RouteRequest | undefined): string | null {
  const body = req?.body;
  if (!body || typeof body !== 'object') {
    return null;
  }
  const sessionId = (body as { sessionId?: unknown }).sessionId;
  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return null;
  }
  return sessionId;
}

function logDebug(
  runtime: IAgentRuntime,
  message: string,
  details: Record<string, unknown>
): void {
  if (!runtime?.logger || typeof runtime.logger.debug !== 'function') {
    return;
  }
  runtime.logger.debug({ src: 'plugin:cozy-doomfire', ...details }, message);
}

function resolveSessionKey(runtime: IAgentRuntime, req?: RouteRequest): string {
  const sessionId = readSessionId(req);
  if (sessionId) {
    return `session:${sessionId}`;
  }
  return runtime.agentId || 'default';
}

function getState(runtime: IAgentRuntime, req?: RouteRequest): AgentState {
  const key = resolveSessionKey(runtime, req);
  const existing = stateBySession.get(key);
  if (existing) {
    return existing;
  }
  const created: AgentState = {
    staged: { ...DEFAULT_SETTINGS },
    applied: { ...DEFAULT_SETTINGS },
    narration: { ...DEFAULT_NARRATION },
  };
  stateBySession.set(key, created);
  return created;
}

function cloneMessages(messages: unknown[]): unknown[] {
  if (typeof structuredClone === 'function') {
    return structuredClone(messages);
  }
  return JSON.parse(JSON.stringify(messages)) as unknown[];
}

function patchBundleMessages(messages: unknown[], applied: FireSettings): void {
  messages.forEach((message) => {
    const update = (message as { surfaceUpdate?: { components?: Array<{ component?: any }> } })
      .surfaceUpdate;
    if (!update || !Array.isArray(update.components)) {
      return;
    }
    update.components.forEach((component) => {
      const doomfire = component?.component?.DoomFireCanvas;
      if (!doomfire?.appliedSettings) {
        return;
      }
      doomfire.appliedSettings = { ...applied };
    });
  });
}

function sanitizeSettings(payload: unknown, fallback: FireSettings): FireSettings {
  if (!payload || typeof payload !== 'object') {
    return { ...fallback };
  }
  const record = payload as Record<string, unknown>;
  const presetId =
    typeof record.presetId === 'string' && PRESET_IDS.has(record.presetId)
      ? record.presetId
      : fallback.presetId;

  return {
    presetId,
    size: typeof record.size === 'number' ? record.size : fallback.size,
    intensity: typeof record.intensity === 'number' ? record.intensity : fallback.intensity,
    heat: typeof record.heat === 'number' ? record.heat : fallback.heat,
    seed: typeof record.seed === 'number' ? record.seed : fallback.seed,
  };
}

function narrationText(phase: string): string {
  switch (phase) {
    case 'collecting':
      return 'Collecting kindling...';
    case 'stacking':
      return 'Stacking the logs...';
    case 'striking':
      return 'Striking the match...';
    case 'burning':
      return 'The fire settles into a steady glow.';
    default:
      return '...';
  }
}

function buildIgniteMessages(settings: FireSettings): unknown[] {
  const phases = ['collecting', 'stacking', 'striking', 'burning'];
  return phases.map((phase, index) => {
    const patch: Record<string, unknown> = {
      narration: {
        phase,
        text: narrationText(phase),
        stepIndex: index + 1,
      },
    };
    if (phase === 'burning') {
      patch.applied = { ...settings };
    }
    return {
      dataModelUpdate: {
        dataModelId: DATA_MODEL_ID,
        patch,
      },
    };
  });
}

function sendJson(res: RouteResponse, status: number, payload: unknown): void {
  res.status(status).json(payload);
}

function handleRenderWidget(
  req: RouteRequest,
  res: RouteResponse,
  runtime: IAgentRuntime
): void {
  const body = req.body as { widgetId?: string; params?: { seed?: number } } | undefined;
  const sessionId = readSessionId(req) || undefined;
  logDebug(runtime, 'A2A renderWidget', {
    widgetId: body?.widgetId || WIDGET_ID,
    sessionId,
  });
  if (body?.widgetId && body.widgetId !== WIDGET_ID) {
    sendJson(res, 400, { ok: false, error: { code: 'unknown_widget' } });
    return;
  }

  const state = getState(runtime, req);
  const seed = body?.params?.seed;
  if (typeof seed === 'number') {
    state.applied = { ...state.applied, seed };
    state.staged = { ...state.staged, seed };
  }

  const messages = cloneMessages(Array.isArray(baseBundle.messages) ? baseBundle.messages : []);
  patchBundleMessages(messages, state.applied);
  messages.push({
    dataModelUpdate: {
      dataModelId: DATA_MODEL_ID,
      patch: {
        staged: { ...state.staged },
        applied: { ...state.applied },
        narration: { ...state.narration },
      },
    },
  });

  sendJson(res, 200, { ok: true, messages });
}

function handleEvent(
  req: RouteRequest,
  res: RouteResponse,
  runtime: IAgentRuntime
): void {
  const body = req.body as { event?: { type?: string; payload?: unknown } } | undefined;
  const event = body?.event ?? (req.body as { type?: string; payload?: unknown } | undefined);

  if (!event || typeof event !== 'object') {
    sendJson(res, 400, { ok: false, error: { code: 'event_missing' } });
    return;
  }
  const sessionId = readSessionId(req) || undefined;
  const eventType = typeof event.type === 'string' ? event.type : 'unknown';
  const presetId =
    eventType === 'fire.applySettings' &&
    event.payload &&
    typeof event.payload === 'object' &&
    typeof (event.payload as { presetId?: unknown }).presetId === 'string'
      ? (event.payload as { presetId: string }).presetId
      : undefined;
  logDebug(runtime, 'A2A event', { eventType, presetId, sessionId });

  if (event.type === 'fire.applySettings') {
    const state = getState(runtime, req);
    const settings = sanitizeSettings(event.payload, state.applied);
    state.applied = { ...state.applied, ...settings };
    state.staged = { ...state.staged, ...settings };
    const messages = buildIgniteMessages(state.applied);
    const last = messages[messages.length - 1] as {
      dataModelUpdate?: { patch?: { narration?: Narration } };
    };
    if (last?.dataModelUpdate?.patch?.narration) {
      state.narration = { ...state.narration, ...last.dataModelUpdate.patch.narration };
    }
    sendJson(res, 200, { ok: true, messages });
    return;
  }

  if (event.type === 'fire.setAudioEnabled') {
    sendJson(res, 200, { ok: true, messages: [] });
    return;
  }

  sendJson(res, 400, { ok: false, error: { code: 'event_not_supported' } });
}

function handleA2a(
  req: RouteRequest,
  res: RouteResponse,
  runtime: IAgentRuntime
): void {
  const body = req.body as { type?: string; event?: unknown } | undefined;
  if (body?.type === 'event') {
    handleEvent({ ...req, body: { event: body.event } }, res, runtime);
    return;
  }
  handleRenderWidget(req, res, runtime);
}

export const doomfirePlugin: Plugin = {
  name: 'cozy-doomfire',
  description: 'Deterministic A2UI DoomFire routes.',
  routes: [
    {
      name: 'health',
      path: '/health',
      type: 'GET',
      handler: async (_req: RouteRequest, res: RouteResponse) => {
        sendJson(res, 200, { ok: true });
      },
    },
    {
      name: 'a2a',
      path: '/a2a',
      type: 'POST',
      handler: async (req: RouteRequest, res: RouteResponse, runtime: IAgentRuntime) => {
        handleA2a(req, res, runtime);
      },
    },
    {
      name: 'event',
      path: '/event',
      type: 'POST',
      handler: async (req: RouteRequest, res: RouteResponse, runtime: IAgentRuntime) => {
        handleEvent(req, res, runtime);
      },
    },
  ],
};

export default doomfirePlugin;

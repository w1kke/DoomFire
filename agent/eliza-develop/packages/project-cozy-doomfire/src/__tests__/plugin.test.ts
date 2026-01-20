import { describe, expect, it } from 'bun:test';
import type { IAgentRuntime, RouteRequest, RouteResponse } from '@elizaos/core';

import doomfirePlugin from '../plugin.ts';

let sessionCounter = 0;
let runtimeCounter = 0;

function createRuntimeWithLogger() {
  runtimeCounter += 1;
  const calls: Array<[Record<string, unknown> | string | Error, string | undefined]> = [];
  const logger = {
    level: 'debug',
    trace: () => {},
    debug: (obj: Record<string, unknown> | string | Error, msg?: string) => {
      calls.push([obj, msg]);
    },
    info: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
    success: () => {},
    progress: () => {},
    log: () => {},
    clear: () => {},
    child: () => logger,
  };
  const runtime = {
    agentId: `test-agent-${runtimeCounter}`,
    logger,
  } as unknown as IAgentRuntime;
  return { runtime, calls };
}

function nextSessionId() {
  sessionCounter += 1;
  return `session-${sessionCounter}`;
}

describe('cozy-doomfire plugin routes', () => {
  it('exposes POST /a2a and POST /event routes', () => {
    const routes = doomfirePlugin.routes || [];
    const routeKeys = routes.map((route) => `${route.type} ${route.path}`);
    expect(routeKeys).toContain('POST /a2a');
    expect(routeKeys).toContain('POST /event');
  });

  it('responds ok on GET /health', async () => {
    const { runtime } = createRuntimeWithLogger();
    const route = doomfirePlugin.routes?.find(
      (entry) => entry.type === 'GET' && entry.path === '/health'
    );
    if (!route?.handler) {
      throw new Error('Health route handler missing');
    }

    const req = {} as RouteRequest;
    const res = createMockResponse();

    await route.handler(req, res, runtime);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ ok: true });
  });

  it('renders main surface from /a2a renderWidget', async () => {
    const { runtime } = createRuntimeWithLogger();
    const route = doomfirePlugin.routes?.find(
      (entry) => entry.type === 'POST' && entry.path === '/a2a'
    );
    if (!route?.handler) {
      throw new Error('A2A route handler missing');
    }

    const req: RouteRequest = {
      body: {
        type: 'renderWidget',
        widgetId: 'com.cozy.doomfire.live',
        params: { mode: 'interactive', seed: 1337 },
      },
    };
    const res = createMockResponse();

    await route.handler(req, res, runtime);

    const messages = res.jsonBody?.messages || [];
    const surfaceUpdate = messages.find((message: any) => message.surfaceUpdate);
    const beginRendering = messages.find((message: any) => message.beginRendering);

    expect(surfaceUpdate?.surfaceUpdate?.surfaceId).toBe('main');
    expect(beginRendering?.beginRendering?.surfaceId).toBe('main');
  });

  it('applies preset updates from fire.applySettings', async () => {
    const { runtime } = createRuntimeWithLogger();
    const route = doomfirePlugin.routes?.find(
      (entry) => entry.type === 'POST' && entry.path === '/event'
    );
    if (!route?.handler) {
      throw new Error('Event route handler missing');
    }

    const req: RouteRequest = {
      body: {
        event: {
          type: 'fire.applySettings',
          payload: {
            presetId: 'copper_blue',
            size: 0.6,
            intensity: 0.5,
            heat: 0.4,
            seed: 1337,
          },
        },
      },
    };
    const res = createMockResponse();

    await route.handler(req, res, runtime);

    const appliedPreset = findAppliedPreset(res.jsonBody?.messages);
    expect(appliedPreset).toBe('copper_blue');
    expect(appliedPreset).not.toBe('cozy_amber');
  });

  it('scopes state by sessionId', async () => {
    const { runtime } = createRuntimeWithLogger();
    const renderRoute = doomfirePlugin.routes?.find(
      (entry) => entry.type === 'POST' && entry.path === '/a2a'
    );
    const eventRoute = doomfirePlugin.routes?.find(
      (entry) => entry.type === 'POST' && entry.path === '/event'
    );
    if (!renderRoute?.handler || !eventRoute?.handler) {
      throw new Error('Route handler missing');
    }

    const sessionA = nextSessionId();
    const sessionB = nextSessionId();

    const renderA = createMockResponse();
    await renderRoute.handler(
      {
        body: {
          type: 'renderWidget',
          widgetId: 'com.cozy.doomfire.live',
          params: { mode: 'interactive', seed: 1337 },
          sessionId: sessionA,
        },
      } as RouteRequest,
      renderA,
      runtime
    );
    expect(findAppliedPreset(renderA.jsonBody?.messages)).toBe('cozy_amber');

    const eventA = createMockResponse();
    await eventRoute.handler(
      {
        body: {
          event: {
            type: 'fire.applySettings',
            payload: {
              presetId: 'copper_blue',
              size: 0.6,
              intensity: 0.5,
              heat: 0.4,
              seed: 1337,
            },
          },
          sessionId: sessionA,
        },
      } as RouteRequest,
      eventA,
      runtime
    );

    const renderB = createMockResponse();
    await renderRoute.handler(
      {
        body: {
          type: 'renderWidget',
          widgetId: 'com.cozy.doomfire.live',
          params: { mode: 'interactive', seed: 1337 },
          sessionId: sessionB,
        },
      } as RouteRequest,
      renderB,
      runtime
    );
    expect(findAppliedPreset(renderB.jsonBody?.messages)).toBe('cozy_amber');

    const renderA2 = createMockResponse();
    await renderRoute.handler(
      {
        body: {
          type: 'renderWidget',
          widgetId: 'com.cozy.doomfire.live',
          params: { mode: 'interactive', seed: 1337 },
          sessionId: sessionA,
        },
      } as RouteRequest,
      renderA2,
      runtime
    );
    expect(findAppliedPreset(renderA2.jsonBody?.messages)).toBe('copper_blue');
  });

  it('logs renderWidget and fire.applySettings requests', async () => {
    const { runtime, calls } = createRuntimeWithLogger();
    const renderRoute = doomfirePlugin.routes?.find(
      (entry) => entry.type === 'POST' && entry.path === '/a2a'
    );
    const eventRoute = doomfirePlugin.routes?.find(
      (entry) => entry.type === 'POST' && entry.path === '/event'
    );
    if (!renderRoute?.handler || !eventRoute?.handler) {
      throw new Error('Route handler missing');
    }

    const sessionId = nextSessionId();
    await renderRoute.handler(
      {
        body: {
          type: 'renderWidget',
          widgetId: 'com.cozy.doomfire.live',
          params: { mode: 'interactive', seed: 1337 },
          sessionId,
        },
      } as RouteRequest,
      createMockResponse(),
      runtime
    );
    await eventRoute.handler(
      {
        body: {
          event: {
            type: 'fire.applySettings',
            payload: {
              presetId: 'copper_blue',
              size: 0.6,
              intensity: 0.5,
              heat: 0.4,
              seed: 1337,
            },
          },
          sessionId,
        },
      } as RouteRequest,
      createMockResponse(),
      runtime
    );

    const messages = calls.map((entry) => entry[1]);
    expect(messages).toContain('A2A renderWidget');
    expect(messages).toContain('A2A event');
  });
});

type MockResponse = RouteResponse & {
  statusCode?: number;
  jsonBody?: any;
};

function createMockResponse(): MockResponse {
  const res = {} as MockResponse;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: unknown) => {
    res.jsonBody = data;
    return res;
  };
  res.send = () => res;
  res.end = () => res;
  return res;
}

function findAppliedPreset(messages: any[] | undefined): string | undefined {
  if (!Array.isArray(messages)) {
    return undefined;
  }
  for (const message of messages) {
    const applied = message?.dataModelUpdate?.patch?.applied;
    if (applied?.presetId) {
      return applied.presetId;
    }
  }
  return undefined;
}

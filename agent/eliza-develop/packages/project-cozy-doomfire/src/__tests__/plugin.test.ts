import { describe, expect, it } from 'bun:test';
import type { IAgentRuntime, RouteRequest, RouteResponse } from '@elizaos/core';

import doomfirePlugin from '../plugin.ts';

const runtime = { agentId: 'test-agent' } as IAgentRuntime;

describe('cozy-doomfire plugin routes', () => {
  it('exposes POST /a2a and POST /event routes', () => {
    const routes = doomfirePlugin.routes || [];
    const routeKeys = routes.map((route) => `${route.type} ${route.path}`);
    expect(routeKeys).toContain('POST /a2a');
    expect(routeKeys).toContain('POST /event');
  });

  it('responds ok on GET /health', async () => {
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

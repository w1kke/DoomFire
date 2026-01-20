const assert = require("node:assert/strict");
const { test } = require("node:test");

const { createAgentClient } = require("../../src/host/agent_client.js");

test("createAgentClient sends renderWidget payloads", async () => {
  const calls = [];
  const fetchStub = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { ok: true, messages: [] };
      },
    };
  };

  const client = createAgentClient({
    endpointUrl: "http://agent.local/a2a",
    fetchImpl: fetchStub,
  });

  const result = await client.renderWidget({
    widgetId: "com.cozy.doomfire.live",
    params: { mode: "interactive", seed: 1337 },
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://agent.local/a2a");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    type: "renderWidget",
    widgetId: "com.cozy.doomfire.live",
    params: { mode: "interactive", seed: 1337 },
  });
});

test("createAgentClient sends event payloads", async () => {
  const calls = [];
  const fetchStub = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { ok: true, updates: [] };
      },
    };
  };

  const client = createAgentClient({
    endpointUrl: "http://agent.local/a2a",
    fetchImpl: fetchStub,
  });

  const result = await client.sendEvent({
    event: { type: "fire.applySettings", payload: { presetId: "cozy_amber" } },
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://agent.local/a2a");
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    type: "event",
    event: { type: "fire.applySettings", payload: { presetId: "cozy_amber" } },
  });
});

test("createAgentClient forwards sessionId when provided", async () => {
  const calls = [];
  const fetchStub = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { ok: true, messages: [] };
      },
    };
  };

  const client = createAgentClient({
    endpointUrl: "http://agent.local/a2a",
    fetchImpl: fetchStub,
  });

  await client.renderWidget({
    widgetId: "com.cozy.doomfire.live",
    params: { mode: "interactive", seed: 1337 },
    sessionId: "session-1",
  });

  await client.sendEvent({
    event: { type: "fire.applySettings", payload: { presetId: "cozy_amber" } },
    sessionId: "session-1",
  });

  assert.equal(calls.length, 2);
  assert.equal(JSON.parse(calls[0].options.body).sessionId, "session-1");
  assert.equal(JSON.parse(calls[1].options.body).sessionId, "session-1");
});

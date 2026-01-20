const assert = require("node:assert/strict");
const { test } = require("node:test");

const { createDoomfireAgentPlugin } = require("../../src/agent/doomfire_agent_plugin.js");

test("agent plugin exposes A2A and event routes", () => {
  const plugin = createDoomfireAgentPlugin();
  assert.ok(Array.isArray(plugin.routes));
  const routes = plugin.routes.map((route) => `${route.method} ${route.path}`);
  assert.ok(routes.includes("POST /a2a"));
  assert.ok(routes.includes("POST /event"));
});

test("fire.applySettings updates applied preset in data model", async () => {
  const plugin = createDoomfireAgentPlugin();
  const route = plugin.routes.find(
    (entry) => entry.method === "POST" && entry.path === "/event"
  );
  assert.ok(route?.handler);

  const result = await route.handler({
    body: {
      event: {
        type: "fire.applySettings",
        payload: {
          presetId: "copper_blue",
          size: 0.6,
          intensity: 0.5,
          heat: 0.4,
          seed: 1337,
        },
      },
    },
  });

  const appliedPreset = findAppliedPreset(result.messages);

  assert.equal(appliedPreset, "copper_blue");
  assert.notEqual(appliedPreset, "cozy_amber");
});

function findAppliedPreset(messages) {
  if (!Array.isArray(messages)) {
    return null;
  }
  let presetId = null;
  messages.forEach((message) => {
    const applied = message?.dataModelUpdate?.patch?.applied;
    if (applied && typeof applied.presetId === "string") {
      presetId = applied.presetId;
    }
  });
  return presetId;
}

const assert = require("node:assert/strict");
const { test } = require("node:test");

const { resolvePointerChain } = require("../../src/host/erc8004_resolver.js");

const agentRegistry = "eip155:84532:0x7177a6867296406881E20d6647232314736Dd09A";
const agentId = "55";

function makeAgentCard(overrides = {}) {
  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "Cozy DoomFire",
    endpoints: [
      {
        name: "A2UI_MANIFEST",
        endpoint: "ipfs://cid/ui-manifest.v2.json",
        version: "2",
      },
    ],
    ...overrides,
  };
}

test("resolvePointerChain fetches agent card and manifest", async () => {
  const agentCard = makeAgentCard();
  const manifest = { manifestVersion: "2", widgets: [] };
  const calls = [];

  const chainReader = {
    async getTokenUri(registry, id) {
      calls.push({ type: "tokenURI", registry, id });
      return "ipfs://cid/agent-card.json";
    },
  };

  const fetchJson = async (uri) => {
    calls.push({ type: "fetch", uri });
    if (uri === "ipfs://cid/agent-card.json") {
      return agentCard;
    }
    if (uri === "ipfs://cid/ui-manifest.v2.json") {
      return manifest;
    }
    throw new Error("unexpected fetch");
  };

  const result = await resolvePointerChain({
    agentRegistry,
    agentId,
    chainReader,
    fetchJson,
  });

  assert.equal(result.ok, true);
  assert.equal(result.agentCard, agentCard);
  assert.equal(result.manifest, manifest);
  assert.equal(result.manifestUri, "ipfs://cid/ui-manifest.v2.json");
  assert.equal(calls[0].type, "tokenURI");
  assert.equal(calls[1].type, "fetch");
  assert.equal(calls[2].type, "fetch");
});

test("resolvePointerChain rejects missing manifest endpoint", async () => {
  const agentCard = makeAgentCard({ endpoints: [] });
  const chainReader = {
    async getTokenUri() {
      return "ipfs://cid/agent-card.json";
    },
  };
  const fetchJson = async () => agentCard;

  const result = await resolvePointerChain({
    agentRegistry,
    agentId,
    chainReader,
    fetchJson,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "manifest_endpoint_missing");
});

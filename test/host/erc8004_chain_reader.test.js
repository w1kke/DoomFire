const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  createRpcChainReader,
  encodeTokenUriCall,
  decodeAbiString,
} = require("../../src/host/erc8004_chain_reader.js");

function encodeAbiString(value) {
  const hex = Buffer.from(value, "utf8").toString("hex");
  const offset = "0".repeat(62) + "20";
  const length = (hex.length / 2).toString(16).padStart(64, "0");
  const padding = "0".repeat((64 - (hex.length % 64)) % 64);
  return `0x${offset}${length}${hex}${padding}`;
}

test("encodeTokenUriCall encodes agentId", () => {
  const call = encodeTokenUriCall("55");
  assert.equal(
    call,
    "0xc87b56dd" + "0".repeat(62) + "37"
  );
});

test("decodeAbiString decodes ABI string", () => {
  const encoded = encodeAbiString("ipfs://cid/agent.json");
  assert.equal(decodeAbiString(encoded), "ipfs://cid/agent.json");
});

test("createRpcChainReader fetches tokenURI via eth_call", async () => {
  const encoded = encodeAbiString("ipfs://cid/agent.json");
  const calls = [];
  const fetchFn = async (url, options) => {
    calls.push({ url, options: JSON.parse(options.body) });
    return {
      ok: true,
      json: async () => ({ result: encoded }),
    };
  };

  const reader = createRpcChainReader({
    rpcUrl: "http://example.com",
    fetchFn,
  });

  const tokenUri = await reader.getTokenUri("0xRegistry", "55");
  assert.equal(tokenUri, "ipfs://cid/agent.json");

  assert.equal(calls[0].url, "http://example.com");
  assert.equal(calls[0].options.method, "eth_call");
  assert.equal(calls[0].options.params[0].to, "0xRegistry");
  assert.equal(
    calls[0].options.params[0].data,
    "0xc87b56dd" + "0".repeat(62) + "37"
  );
});

const TOKEN_URI_SELECTOR = "0xc87b56dd";

function createRpcChainReader({ rpcUrl, fetchFn } = {}) {
  if (!rpcUrl || typeof rpcUrl !== "string") {
    throw new Error("rpcUrl is required");
  }
  const fetcher = fetchFn || fetch;

  return {
    async getTokenUri(registry, agentId) {
      if (!registry || typeof registry !== "string") {
        throw new Error("registry is required");
      }
      const data = encodeTokenUriCall(agentId);
      const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: registry, data }, "latest"],
      };

      const response = await fetcher(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.status}`);
      }

      const body = await response.json();
      if (body.error) {
        throw new Error(body.error.message || "RPC error");
      }
      if (!body.result) {
        throw new Error("RPC response missing result");
      }

      return decodeAbiString(body.result);
    },
  };
}

function encodeTokenUriCall(agentId) {
  const encodedId = encodeUint256(agentId);
  return `${TOKEN_URI_SELECTOR}${encodedId}`;
}

function encodeUint256(value) {
  const big = BigInt(value);
  const hex = big.toString(16).padStart(64, "0");
  return hex;
}

function decodeAbiString(hexValue) {
  const hex = hexValue.startsWith("0x") ? hexValue.slice(2) : hexValue;
  if (hex.length < 128) {
    throw new Error("Invalid ABI string");
  }
  const lengthHex = hex.slice(64, 128);
  const length = Number.parseInt(lengthHex, 16);
  const dataStart = 128;
  const dataHex = hex.slice(dataStart, dataStart + length * 2);
  return Buffer.from(dataHex, "hex").toString("utf8");
}

module.exports = {
  createRpcChainReader,
  encodeTokenUriCall,
  decodeAbiString,
};

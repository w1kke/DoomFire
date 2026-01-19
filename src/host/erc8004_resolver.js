function resolveIpfsUri(uri, ipfsGateway) {
  if (!ipfsGateway || typeof uri !== "string" || !uri.startsWith("ipfs://")) {
    return uri;
  }
  const trimmed = uri.replace("ipfs://", "");
  const base = ipfsGateway.replace(/\/$/, "");
  return `${base}/ipfs/${trimmed}`;
}

async function resolvePointerChain({
  agentRegistry,
  agentId,
  chainReader,
  fetchJson,
  ipfsGateway,
}) {
  if (!chainReader || typeof chainReader.getTokenUri !== "function") {
    return {
      ok: false,
      error: {
        code: "chain_reader_missing",
        message: "chainReader.getTokenUri is required",
      },
    };
  }

  if (!fetchJson || typeof fetchJson !== "function") {
    return {
      ok: false,
      error: {
        code: "fetch_missing",
        message: "fetchJson is required",
      },
    };
  }

  let tokenUri;
  try {
    tokenUri = await chainReader.getTokenUri(agentRegistry, agentId);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "token_uri_failed",
        message: error instanceof Error ? error.message : "tokenURI failed",
      },
    };
  }

  if (!tokenUri) {
    return {
      ok: false,
      error: {
        code: "token_uri_missing",
        message: "tokenURI returned empty value",
      },
    };
  }

  const agentCardUri = resolveIpfsUri(tokenUri, ipfsGateway);
  let agentCard;
  try {
    agentCard = await fetchJson(agentCardUri);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "agent_card_fetch_failed",
        message: error instanceof Error ? error.message : "Agent card fetch failed",
      },
    };
  }

  const manifestEndpoint = findManifestEndpoint(agentCard);
  if (!manifestEndpoint) {
    return {
      ok: false,
      error: {
        code: "manifest_endpoint_missing",
        message: "Agent card missing A2UI_MANIFEST endpoint",
      },
    };
  }

  const manifestUri = resolveIpfsUri(manifestEndpoint.endpoint, ipfsGateway);
  let manifest;
  try {
    manifest = await fetchJson(manifestUri);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "manifest_fetch_failed",
        message: error instanceof Error ? error.message : "Manifest fetch failed",
      },
    };
  }

  return {
    ok: true,
    tokenUri,
    agentCardUri,
    agentCard,
    manifestUri,
    manifest,
  };
}

function findManifestEndpoint(agentCard) {
  if (!agentCard || !Array.isArray(agentCard.endpoints)) {
    return null;
  }
  return agentCard.endpoints.find((endpoint) => {
    if (!endpoint || typeof endpoint !== "object") {
      return false;
    }
    const nameMatches = endpoint.name === "A2UI_MANIFEST";
    const versionMatches = String(endpoint.version) === "2";
    return nameMatches && versionMatches && typeof endpoint.endpoint === "string";
  });
}

module.exports = {
  resolvePointerChain,
  resolveIpfsUri,
};

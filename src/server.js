const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const { loadManifestFromFile } = require("./host/manifest_loader.js");
const { renderPreviewFromManifest } = require("./host/preview_renderer.js");
const { createLiveSession } = require("./host/live_session.js");
const { createAgentClient } = require("./host/agent_client.js");
const { resolvePointerChain } = require("./host/erc8004_resolver.js");
const { createRpcChainReader } = require("./host/erc8004_chain_reader.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const WEB_DIR = path.join(ROOT_DIR, "web");
const ARTIFACTS_DIR = path.join(ROOT_DIR, "artifacts");
const TEST_VECTORS_DIR = path.join(ROOT_DIR, "test", "test_vectors");
const DEFAULT_REGISTRY = "eip155:84532:0x7177a6867296406881E20d6647232314736Dd09A";
const DEFAULT_RPC_URL = "https://sepolia.base.org";
const DEFAULT_IPFS_GATEWAY = "https://ipfs.io";

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

let liveSession = null;
let liveSurfaceId = null;
let liveAgentClient = null;

function resolveManifestPath(manifestParam) {
  const defaultPath = path.join(ARTIFACTS_DIR, "ui-manifest.v2.json");
  if (!manifestParam) {
    return defaultPath;
  }

  const normalized = manifestParam.replace(/^\//, "");
  const candidate = path.resolve(ROOT_DIR, normalized);
  const allowedRoots = [ARTIFACTS_DIR, TEST_VECTORS_DIR];
  if (!allowedRoots.some((root) => candidate.startsWith(root))) {
    return null;
  }
  if (!fs.existsSync(candidate)) {
    return null;
  }
  return candidate;
}

async function handlePreview(request, response, url) {
  const manifestResult = await resolveManifestFromRequest(url);
  if (!manifestResult.ok) {
    return sendJson(response, 400, { ok: false, error: manifestResult.error });
  }

  const preview = renderPreviewFromManifest(manifestResult.manifest);
  if (!preview.ok) {
    return sendJson(response, 200, {
      ok: false,
      errors: preview.errors,
      fallback: preview.fallback,
    });
  }

  return sendJson(response, 200, { ok: true, renderPlan: preview.renderPlan });
}

function handleLiveStart(request, response, url) {
  collectJson(request, async (body) => {
    try {
      const manifestResult = await resolveManifestFromRequest(url);
      if (!manifestResult.ok) {
        return sendJson(response, 400, { ok: false, error: manifestResult.error });
      }

      const widget = manifestResult.manifest.widgets[0];
      liveSession = createLiveSession({ widget });
      liveSurfaceId = widget?.surfaceContract?.surfaceIds?.[0] || "main";
      liveAgentClient = null;

      const start = liveSession.start({ userInitiated: body?.userInitiated === true });
      if (!start.ok) {
        return sendJson(response, 403, { ok: false, error: start.error });
      }

      const agentEndpoint = resolveAgentEndpoint({
        agentCard: manifestResult.agentCard,
      });

      if (!agentEndpoint) {
        return sendJson(response, 400, {
          ok: false,
          error: { code: "agent_endpoint_missing" },
        });
      }

      try {
        liveAgentClient = createAgentClient({ endpointUrl: agentEndpoint });
      } catch (error) {
        return sendJson(response, 400, {
          ok: false,
          error: { code: "agent_endpoint_invalid" },
        });
      }

      const invocation = widget?.invocation?.request || {};
      const renderRequest = {
        widgetId: invocation.widgetId || widget?.id,
        params: invocation.params || { mode: "interactive" },
      };

      const renderResult = await liveAgentClient.renderWidget(renderRequest);
      if (!renderResult.ok || !Array.isArray(renderResult.messages)) {
        return sendJson(response, 502, {
          ok: false,
          error: renderResult.error || { code: "agent_render_failed" },
        });
      }

      renderResult.messages.forEach((message) => liveSession.applyMessage(message));

      const surface = liveSession.getSurface(liveSurfaceId);
      return sendJson(response, 200, {
        ok: true,
        live: liveSession.isLive(),
        liveBadge: liveSession.isLiveBadgeVisible(),
        surface,
      });
    } catch (error) {
      return sendJson(response, 500, {
        ok: false,
        error: { code: "live_start_failed" },
      });
    }
  });
}

function handleLiveEvent(request, response) {
  collectJson(request, async (body) => {
    if (!liveSession) {
      return sendJson(response, 400, {
        ok: false,
        error: { code: "session_missing" },
      });
    }
    if (!liveAgentClient) {
      return sendJson(response, 400, {
        ok: false,
        error: { code: "agent_session_missing" },
      });
    }

    const event = body?.event;
    const dispatched = liveSession.dispatchEvent(event);
    if (!dispatched.ok) {
      return sendJson(response, 403, { ok: false, error: dispatched.error });
    }

    const agentResult = await liveAgentClient.sendEvent({ event });
    if (!agentResult.ok) {
      return sendJson(response, 502, {
        ok: false,
        error: agentResult.error || { code: "agent_event_failed" },
      });
    }

    return sendJson(response, 200, {
      ok: true,
      updates: collectAgentUpdates(agentResult),
    });
  });
}

function handleStatic(request, response, url) {
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  filePath = path.normalize(filePath).replace(/^\.\.(\/.+)?$/, "/index.html");
  const resolvedPath = path.join(WEB_DIR, filePath);

  if (!resolvedPath.startsWith(WEB_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      if (filePath !== "/index.html") {
        response.writeHead(404);
        response.end("Not Found");
        return;
      }
      response.writeHead(500);
      response.end("Missing index.html");
      return;
    }

    const ext = path.extname(resolvedPath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    });
    response.end(data);
  });
}

function handleArtifacts(request, response, url) {
  const safePath = path.normalize(url.pathname).replace(/^\/+/, "");
  const resolvedPath = path.resolve(ROOT_DIR, safePath);
  const allowedRoot = path.join(ARTIFACTS_DIR, "audio");

  if (!resolvedPath.startsWith(allowedRoot)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      response.writeHead(404);
      response.end("Not Found");
      return;
    }

    const ext = path.extname(resolvedPath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    });
    response.end(data);
  });
}

async function resolveManifestFromRequest(url) {
  const agentId = url.searchParams.get("agentId");
  if (agentId) {
    return resolveManifestFromChain({
      agentId,
      agentRegistry: url.searchParams.get("agentRegistry") || DEFAULT_REGISTRY,
    });
  }

  const manifestPath = resolveManifestPath(url.searchParams.get("manifest"));
  if (!manifestPath) {
    return {
      ok: false,
      error: { code: "manifest_not_found" },
    };
  }

  const manifestResult = loadManifestFromFile(manifestPath);
  if (!manifestResult.ok) {
    return { ok: false, error: manifestResult.error };
  }

  return { ok: true, manifest: manifestResult.value, agentCard: null };
}

async function resolveManifestFromChain({ agentId, agentRegistry }) {
  try {
    const registry = normalizeRegistryAddress(agentRegistry);
    if (!registry) {
      return {
        ok: false,
        error: { code: "agent_registry_missing" },
      };
    }

    const rpcUrl = process.env.ERC8004_RPC_URL || DEFAULT_RPC_URL;
    const ipfsGateway = process.env.IPFS_GATEWAY || DEFAULT_IPFS_GATEWAY;
    const chainReader = createRpcChainReader({ rpcUrl });
    const fetchJson = createJsonFetcher();

    const result = await resolvePointerChain({
      agentRegistry: registry,
      agentId,
      chainReader,
      fetchJson,
      ipfsGateway,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, manifest: result.manifest, agentCard: result.agentCard };
  } catch (error) {
    return {
      ok: false,
      error: { code: "pointer_chain_failed" },
    };
  }
}

function resolveAgentEndpoint({ agentCard }) {
  const fromCard = findAgentEndpoint(agentCard);
  if (fromCard) {
    return fromCard;
  }
  return process.env.A2A_ENDPOINT || process.env.AGENT_ENDPOINT || null;
}

function findAgentEndpoint(agentCard) {
  const endpoints = agentCard?.endpoints;
  if (!Array.isArray(endpoints)) {
    return null;
  }
  const entry = endpoints.find(
    (endpoint) =>
      endpoint &&
      endpoint.name === "A2A" &&
      typeof endpoint.endpoint === "string"
  );
  return entry ? entry.endpoint : null;
}

function collectAgentUpdates(agentResult) {
  if (Array.isArray(agentResult.updates)) {
    return agentResult.updates;
  }

  if (!Array.isArray(agentResult.messages)) {
    return [];
  }

  const updates = [];
  agentResult.messages.forEach((message) => {
    const patch = message?.dataModelUpdate?.patch;
    if (!patch || typeof patch !== "object") {
      return;
    }
    const update = {};
    if (patch.applied) {
      update.applied = patch.applied;
    }
    if (patch.narration) {
      update.narration = patch.narration;
    }
    if (Object.keys(update).length > 0) {
      updates.push(update);
    }
  });

  return updates;
}

function normalizeRegistryAddress(registry) {
  if (!registry || typeof registry !== "string") {
    return null;
  }
  const parts = registry.split(":");
  return parts[parts.length - 1];
}

function createJsonFetcher() {
  return async (uri) => {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    return response.json();
  };
}

function collectJson(request, callback) {
  let body = "";
  request.on("data", (chunk) => {
    body += chunk;
  });
  request.on("end", () => {
    if (!body) {
      callback(null);
      return;
    }
    try {
      callback(JSON.parse(body));
    } catch (error) {
      callback(null);
    }
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/preview" && request.method === "GET") {
    handlePreview(request, response, url).catch(() => {
      sendJson(response, 500, { ok: false, error: { code: "preview_failed" } });
    });
    return;
  }
  if (url.pathname === "/api/live/start" && request.method === "POST") {
    return handleLiveStart(request, response, url);
  }
  if (url.pathname === "/api/live/event" && request.method === "POST") {
    return handleLiveEvent(request, response);
  }
  if (url.pathname.startsWith("/artifacts/")) {
    return handleArtifacts(request, response, url);
  }

  return handleStatic(request, response, url);
});

const port = Number(process.env.PORT) || 4173;
const host = process.env.HOST || "127.0.0.1";
server.listen(port, host, () => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`Server running at http://${host}:${port}`);
  }
});

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const { loadManifestFromFile } = require("./host/manifest_loader.js");
const { renderPreviewFromManifest } = require("./host/preview_renderer.js");
const { createLiveSession } = require("./host/live_session.js");
const { respondToIgnite } = require("./agent/ignite_responder.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const WEB_DIR = path.join(ROOT_DIR, "web");
const ARTIFACTS_DIR = path.join(ROOT_DIR, "artifacts");
const TEST_VECTORS_DIR = path.join(ROOT_DIR, "test", "test_vectors");

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
};

let liveSession = null;
let liveSurfaceId = null;

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

function loadLiveBundle() {
  const bundlePath = path.join(ARTIFACTS_DIR, "live-bundle.json");
  const raw = fs.readFileSync(bundlePath, "utf8");
  return JSON.parse(raw);
}

function handlePreview(request, response, url) {
  const manifestPath = resolveManifestPath(url.searchParams.get("manifest"));
  if (!manifestPath) {
    return sendJson(response, 400, {
      ok: false,
      error: { code: "manifest_not_found" },
    });
  }

  const manifestResult = loadManifestFromFile(manifestPath);
  if (!manifestResult.ok) {
    return sendJson(response, 400, { ok: false, error: manifestResult.error });
  }

  const preview = renderPreviewFromManifest(manifestResult.value);
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
  collectJson(request, (body) => {
    const manifestPath = resolveManifestPath(url.searchParams.get("manifest"));
    if (!manifestPath) {
      return sendJson(response, 400, {
        ok: false,
        error: { code: "manifest_not_found" },
      });
    }

    const manifestResult = loadManifestFromFile(manifestPath);
    if (!manifestResult.ok) {
      return sendJson(response, 400, { ok: false, error: manifestResult.error });
    }

    const widget = manifestResult.value.widgets[0];
    liveSession = createLiveSession({ widget });
    liveSurfaceId = widget?.surfaceContract?.surfaceIds?.[0] || "main";

    const start = liveSession.start({ userInitiated: body?.userInitiated === true });
    if (!start.ok) {
      return sendJson(response, 403, { ok: false, error: start.error });
    }

    const bundle = loadLiveBundle();
    if (Array.isArray(bundle.messages)) {
      bundle.messages.forEach((message) => liveSession.applyMessage(message));
    }

    const surface = liveSession.getSurface(liveSurfaceId);
    return sendJson(response, 200, {
      ok: true,
      live: liveSession.isLive(),
      liveBadge: liveSession.isLiveBadgeVisible(),
      surface,
    });
  });
}

function handleLiveEvent(request, response) {
  collectJson(request, (body) => {
    if (!liveSession) {
      return sendJson(response, 400, {
        ok: false,
        error: { code: "session_missing" },
      });
    }

    const event = body?.event;
    const dispatched = liveSession.dispatchEvent(event);
    if (!dispatched.ok) {
      return sendJson(response, 403, { ok: false, error: dispatched.error });
    }

    let updates = [];
    if (event?.type === "fire.applySettings") {
      updates = respondToIgnite({ event });
    }

    return sendJson(response, 200, { ok: true, updates });
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
    return handlePreview(request, response, url);
  }
  if (url.pathname === "/api/live/start" && request.method === "POST") {
    return handleLiveStart(request, response, url);
  }
  if (url.pathname === "/api/live/event" && request.method === "POST") {
    return handleLiveEvent(request, response);
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

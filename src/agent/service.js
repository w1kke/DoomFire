const http = require("node:http");
const { URL } = require("node:url");

function createAgentService({ plugin }) {
  if (!plugin || !Array.isArray(plugin.routes)) {
    throw new Error("plugin_routes_missing");
  }

  const routes = plugin.routes;

  return http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const method = (request.method || "GET").toUpperCase();

    const route = routes.find(
      (entry) =>
        entry &&
        entry.method &&
        entry.path &&
        entry.method.toUpperCase() === method &&
        entry.path === url.pathname
    );

    if (!route) {
      response.writeHead(404);
      response.end("Not Found");
      return;
    }

    const body = await collectJson(request);
    try {
      const result = await route.handler({ body, request, query: url.searchParams });
      const payload =
        result && result.json ? result.json : result === undefined ? {} : result;
      const status =
        result && result.status
          ? result.status
          : payload && payload.ok === false
            ? 400
            : 200;
      sendJson(response, status, payload);
    } catch (error) {
      sendJson(response, 500, { ok: false, error: { code: "route_failed" } });
    }
  });
}

function collectJson(request) {
  return new Promise((resolve) => {
    if (request.method === "GET" || request.method === "HEAD") {
      resolve(null);
      return;
    }

    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve(null);
      }
    });
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

module.exports = {
  createAgentService,
};

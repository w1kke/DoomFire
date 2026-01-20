function createAgentClient({ endpointUrl, fetchImpl } = {}) {
  if (!endpointUrl || typeof endpointUrl !== "string") {
    throw new Error("agent_endpoint_missing");
  }

  const fetcher = fetchImpl || fetch;
  const timeoutMs = 5000;

  async function post(payload) {
    let response = null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      response = await fetcher(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      const code = error?.name === "AbortError" ? "agent_timeout" : "agent_unreachable";
      return { ok: false, error: { code } };
    } finally {
      clearTimeout(timeoutId);
    }

    let json = null;
    try {
      json = await response.json();
    } catch (error) {
      return { ok: false, error: { code: "invalid_agent_response" } };
    }

    if (!response.ok || json?.ok === false) {
      return {
        ok: false,
        error: json?.error || { code: "agent_request_failed" },
      };
    }

    return json;
  }

  function renderWidget({ widgetId, params, sessionId }) {
    const payload = { type: "renderWidget", widgetId, params };
    if (typeof sessionId === "string" && sessionId.length > 0) {
      payload.sessionId = sessionId;
    }
    return post(payload);
  }

  function sendEvent({ event, sessionId }) {
    const payload = { type: "event", event };
    if (typeof sessionId === "string" && sessionId.length > 0) {
      payload.sessionId = sessionId;
    }
    return post(payload);
  }

  return {
    renderWidget,
    sendEvent,
  };
}

module.exports = {
  createAgentClient,
};

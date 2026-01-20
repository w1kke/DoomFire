function createAgentClient({ endpointUrl, fetchImpl } = {}) {
  if (!endpointUrl || typeof endpointUrl !== "string") {
    throw new Error("agent_endpoint_missing");
  }

  const fetcher = fetchImpl || fetch;

  async function post(payload) {
    const response = await fetcher(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

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

  function renderWidget({ widgetId, params }) {
    return post({ type: "renderWidget", widgetId, params });
  }

  function sendEvent({ event }) {
    return post({ type: "event", event });
  }

  return {
    renderWidget,
    sendEvent,
  };
}

module.exports = {
  createAgentClient,
};

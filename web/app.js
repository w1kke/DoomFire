const previewRoot = document.getElementById("preview-root");
const previewFallback = document.getElementById("preview-fallback");
const liveRoot = document.getElementById("live-root");
const liveBadge = document.getElementById("live-badge");

const state = {
  manifestPath: getManifestPath(),
  live: false,
  liveSurface: null,
  narration: null,
};

async function loadPreview() {
  const response = await fetch(
    `/api/preview?manifest=${encodeURIComponent(state.manifestPath)}`
  );
  const data = await response.json();

  if (!data.ok) {
    previewFallback.hidden = false;
    previewRoot.innerHTML = "";
    return;
  }

  previewFallback.hidden = true;
  previewRoot.innerHTML = "";
  const element = renderPlan(data.renderPlan, {
    openLive: handleOpenLive,
  });
  previewRoot.appendChild(element);
}

async function handleOpenLive() {
  if (state.live) {
    return;
  }

  const response = await fetch(
    `/api/live/start?manifest=${encodeURIComponent(state.manifestPath)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInitiated: true }),
    }
  );

  const data = await response.json();
  if (!data.ok) {
    return;
  }

  state.live = data.live === true;
  liveBadge.hidden = !data.liveBadge;
  if (data.surface) {
    state.liveSurface = data.surface;
    renderLiveSurface(data.surface);
  }
}

function renderLiveSurface(surface) {
  liveRoot.innerHTML = "";
  const element = renderPlan(
    {
      surfaceId: "main",
      rootId: surface.rootId,
      components: surface.components,
    },
    {
      ignite: handleIgnite,
    }
  );
  liveRoot.appendChild(element);
}

async function handleIgnite() {
  if (!state.live) {
    return;
  }

  const event = {
    type: "fire.applySettings",
    payload: {
      presetId: "cozy_amber",
      size: 0.7,
      intensity: 0.6,
      heat: 0.6,
    },
  };

  const response = await fetch("/api/live/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  });

  const data = await response.json();
  if (!data.ok) {
    return;
  }

  if (Array.isArray(data.updates) && state.liveSurface) {
    const narration = data.updates
      .map((update) => update.narration && update.narration.text)
      .filter(Boolean)
      .join(" ");
    const narrationNode = document.createElement("p");
    narrationNode.className = "text--body";
    narrationNode.textContent = narration;
    liveRoot.appendChild(narrationNode);
  }
}

function renderPlan(plan, handlers) {
  return renderComponent(plan.rootId, plan.components, handlers);
}

function renderComponent(componentId, components, handlers) {
  const entry = components[componentId];
  if (!entry || typeof entry.component !== "object") {
    const missing = document.createElement("div");
    missing.textContent = "Unsupported component.";
    return missing;
  }

  const [type, props] = Object.entries(entry.component)[0] || [];

  switch (type) {
    case "Card":
      return renderCard(props, components, handlers);
    case "Column":
      return renderColumn(props, components, handlers);
    case "Text":
      return renderText(props);
    case "Button":
      return renderButton(props, handlers);
    case "DoomFireCanvas":
      return renderDoomFireCanvas();
    case "Image":
      return renderImagePlaceholder(props);
    default: {
      const fallback = document.createElement("div");
      fallback.textContent = `Unsupported component: ${type || "unknown"}`;
      return fallback;
    }
  }
}

function renderCard(props, components, handlers) {
  const card = document.createElement("div");
  card.className = "card";

  if (props && props.child) {
    card.appendChild(renderComponent(props.child, components, handlers));
  }

  return card;
}

function renderColumn(props, components, handlers) {
  const column = document.createElement("div");
  column.className = "column";
  const children = props?.children?.explicitList;

  if (Array.isArray(children)) {
    children.forEach((childId) => {
      column.appendChild(renderComponent(childId, components, handlers));
    });
  }

  return column;
}

function renderText(props) {
  const usage = props?.usageHint || "body";
  const text = props?.text?.literalString || "";
  const element = document.createElement(usage === "h2" ? "h2" : "p");
  element.className = usage === "h2" ? "text--h2" : "text--body";
  element.textContent = text;
  return element;
}

function renderButton(props, handlers) {
  const button = document.createElement("button");
  button.className = "button";
  button.type = "button";
  button.textContent = props?.label?.literalString || "Button";

  const actionType = props?.action?.hostEvent?.type;
  if (actionType === "openLive" && handlers?.openLive) {
    button.addEventListener("click", handlers.openLive);
  }
  if (actionType === "ignite" && handlers?.ignite) {
    button.addEventListener("click", handlers.ignite);
  }

  return button;
}

function renderDoomFireCanvas() {
  const canvas = document.createElement("div");
  canvas.className = "doomfire-canvas";
  canvas.textContent = "";
  return canvas;
}

function renderImagePlaceholder(props) {
  const placeholder = document.createElement("div");
  placeholder.className = "text--body";
  const alt = props?.altText?.literalString || "Image";
  placeholder.textContent = `${alt} (blocked in preview)`;
  return placeholder;
}

function getManifestPath() {
  const params = new URLSearchParams(window.location.search);
  return params.get("manifest") || "artifacts/ui-manifest.v2.json";
}

loadPreview();

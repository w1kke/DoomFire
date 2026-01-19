const { validatePreviewBundle } = require("../validation/index.js");

const DEFAULT_PREVIEW_POLICY = Object.freeze({
  allowedSurfaces: ["preview"],
  allowNetwork: false,
  allowExternalLinks: false,
  allowWalletIntents: false,
});

function renderPreview(bundle, policy = {}) {
  const resolvedPolicy = normalizePreviewPolicy(policy);
  const errors = [];

  const validation = validatePreviewBundle(bundle, {
    allowedSurfaces: resolvedPolicy.allowedSurfaces,
  });
  if (!validation.ok) {
    errors.push(...validation.errors);
  }

  if (validation.ok) {
    errors.push(...collectSandboxViolations(bundle, resolvedPolicy));
  }

  if (errors.length > 0) {
    return { ok: false, errors, fallback: buildFallback() };
  }

  const planResult = buildRenderPlan(bundle, resolvedPolicy.allowedSurfaces);
  if (!planResult.ok) {
    return { ok: false, errors: planResult.errors, fallback: buildFallback() };
  }

  return { ok: true, renderPlan: planResult.renderPlan };
}

function renderPreviewFromManifest(manifest, options = {}) {
  const errors = [];
  if (!manifest || !Array.isArray(manifest.widgets) || manifest.widgets.length === 0) {
    errors.push({
      code: "manifest_missing_widgets",
      path: "widgets",
      message: "Manifest has no widgets",
    });
    return { ok: false, errors, fallback: buildFallback() };
  }

  const widget = options.widgetId
    ? manifest.widgets.find((entry) => entry.id === options.widgetId)
    : manifest.widgets[0];

  if (!widget || !widget.preview || !widget.preview.payload) {
    errors.push({
      code: "preview_missing",
      path: "widgets.preview",
      message: "Preview payload missing",
    });
    return { ok: false, errors, fallback: buildFallback() };
  }

  if (widget.preview.payload.mode !== "inlineMessageBundle") {
    errors.push({
      code: "preview_mode_unsupported",
      path: "widgets.preview.payload.mode",
      message: "Preview payload mode not supported",
    });
    return { ok: false, errors, fallback: buildFallback() };
  }

  return renderPreview(widget.preview.payload.bundle, widget.preview.policy || {});
}

function normalizePreviewPolicy(policy) {
  return {
    allowedSurfaces: Array.isArray(policy.allowedSurfaces)
      ? policy.allowedSurfaces
      : DEFAULT_PREVIEW_POLICY.allowedSurfaces,
    allowNetwork:
      typeof policy.allowNetwork === "boolean"
        ? policy.allowNetwork
        : DEFAULT_PREVIEW_POLICY.allowNetwork,
    allowExternalLinks:
      typeof policy.allowExternalLinks === "boolean"
        ? policy.allowExternalLinks
        : DEFAULT_PREVIEW_POLICY.allowExternalLinks,
    allowWalletIntents:
      typeof policy.allowWalletIntents === "boolean"
        ? policy.allowWalletIntents
        : DEFAULT_PREVIEW_POLICY.allowWalletIntents,
  };
}

function buildRenderPlan(bundle, allowedSurfaces) {
  const errors = [];
  const surfaceId = allowedSurfaces[0] || "preview";
  const components = {};
  let rootId = null;

  if (Array.isArray(bundle.messages)) {
    bundle.messages.forEach((message) => {
      if (message && message.surfaceUpdate && message.surfaceUpdate.surfaceId === surfaceId) {
        const list = message.surfaceUpdate.components;
        if (Array.isArray(list)) {
          list.forEach((component) => {
            if (component && typeof component.id === "string") {
              components[component.id] = component;
            }
          });
        }
      }

      if (message && message.beginRendering && message.beginRendering.surfaceId === surfaceId) {
        rootId = message.beginRendering.root;
      }
    });
  }

  if (!rootId) {
    errors.push({
      code: "missing_root",
      path: "beginRendering.root",
      message: "Missing beginRendering root",
    });
  } else if (!components[rootId]) {
    errors.push({
      code: "unknown_root",
      path: "beginRendering.root",
      message: "Root component not found",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    renderPlan: {
      surfaceId,
      rootId,
      components,
    },
  };
}

function collectSandboxViolations(bundle, policy) {
  const errors = [];
  const components = [];

  if (Array.isArray(bundle.messages)) {
    bundle.messages.forEach((message, messageIndex) => {
      if (message && message.surfaceUpdate && Array.isArray(message.surfaceUpdate.components)) {
        message.surfaceUpdate.components.forEach((component, componentIndex) => {
          components.push({
            component,
            path: `messages[${messageIndex}].surfaceUpdate.components[${componentIndex}]`,
          });
        });
      }
    });
  }

  components.forEach((entry) => {
    scanValue(entry.component, entry.path, errors, policy);
  });

  return errors;
}

function scanValue(value, path, errors, policy) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      scanValue(item, `${path}[${index}]`, errors, policy);
    });
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;

    if (!policy.allowExternalLinks && isOpenUrlKey(key)) {
      errors.push({
        code: "external_link_disallowed",
        path: childPath,
        message: "External links are not allowed in preview",
      });
    }

    if (!policy.allowWalletIntents && isWalletIntentKey(key)) {
      errors.push({
        code: "wallet_intent_disallowed",
        path: childPath,
        message: "Wallet intents are not allowed in preview",
      });
    }

    if (typeof child === "string" && isUrlKey(key) && looksLikeRemoteUrl(child)) {
      if (!policy.allowNetwork) {
        errors.push({
          code: "network_disallowed",
          path: childPath,
          message: "Network URLs are not allowed in preview",
        });
      }
      if (!policy.allowExternalLinks) {
        errors.push({
          code: "external_link_disallowed",
          path: childPath,
          message: "External links are not allowed in preview",
        });
      }
    }

    scanValue(child, childPath, errors, policy);
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isOpenUrlKey(key) {
  return key === "OpenUrl" || key === "openUrl";
}

function isWalletIntentKey(key) {
  return key === "WalletIntent" || key === "walletIntent";
}

function isUrlKey(key) {
  return key === "url" || key === "uri" || key === "href" || key === "src";
}

function looksLikeRemoteUrl(value) {
  return /^(https?:|ipfs:)/i.test(value);
}

function buildFallback() {
  return {
    kind: "placeholder",
    text: "Preview unavailable.",
  };
}

module.exports = {
  renderPreview,
  renderPreviewFromManifest,
  buildRenderPlan,
  collectSandboxViolations,
};

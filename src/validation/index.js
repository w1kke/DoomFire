const REQUIRED_MANIFEST_TYPE =
  "https://eips.ethereum.org/EIPS/eip-8004#ui-manifest-v2";
const REQUIRED_MANIFEST_VERSION = "2";

function safeParseJson(input) {
  if (typeof input !== "string") {
    return {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Expected JSON string input",
      },
    };
  }

  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "invalid_json",
        message: error instanceof Error ? error.message : "Invalid JSON",
      },
    };
  }
}

function validateUiManifest(manifest) {
  const errors = [];

  if (!isPlainObject(manifest)) {
    errors.push({
      code: "invalid_type",
      path: "manifest",
      message: "Manifest must be an object",
    });
    return { ok: false, errors };
  }

  requireString(manifest.type, "type", errors, {
    equals: REQUIRED_MANIFEST_TYPE,
  });
  requireString(manifest.manifestVersion, "manifestVersion", errors, {
    equals: REQUIRED_MANIFEST_VERSION,
  });
  requireString(manifest.agentRegistry, "agentRegistry", errors);
  requireString(manifest.agentId, "agentId", errors);
  requireString(manifest.updatedAt, "updatedAt", errors);

  if (!isPlainObject(manifest.a2ui)) {
    errors.push({
      code: "invalid_type",
      path: "a2ui",
      message: "a2ui must be an object",
    });
  } else {
    requireString(manifest.a2ui.version, "a2ui.version", errors);
    requireString(manifest.a2ui.a2aExtensionUri, "a2ui.a2aExtensionUri", errors);
    requireString(manifest.a2ui.dataPartMimeType, "a2ui.dataPartMimeType", errors);
    requireStringArray(
      manifest.a2ui.supportedCatalogIds,
      "a2ui.supportedCatalogIds",
      errors,
      { minLength: 1 }
    );
    requireBoolean(
      manifest.a2ui.acceptsInlineCatalogs,
      "a2ui.acceptsInlineCatalogs",
      errors
    );
  }

  requireArray(manifest.widgets, "widgets", errors, { minLength: 1 });

  return { ok: errors.length === 0, errors };
}

function validatePreviewBundle(bundle, options = {}) {
  const errors = [];
  const allowedSurfaces = Array.isArray(options.allowedSurfaces)
    ? options.allowedSurfaces
    : ["preview"];

  if (!isPlainObject(bundle)) {
    errors.push({
      code: "invalid_type",
      path: "bundle",
      message: "Bundle must be an object",
    });
    return { ok: false, errors };
  }

  requireArray(bundle.messages, "messages", errors, { minLength: 1 });

  if (Array.isArray(bundle.messages)) {
    bundle.messages.forEach((message, index) => {
      if (!isPlainObject(message)) {
        errors.push({
          code: "invalid_type",
          path: `messages[${index}]`,
          message: "Message must be an object",
        });
        return;
      }

      if (isPlainObject(message.surfaceUpdate)) {
        requireSurfaceId(
          message.surfaceUpdate.surfaceId,
          `messages[${index}].surfaceUpdate.surfaceId`,
          errors,
          allowedSurfaces
        );
      }

      if (isPlainObject(message.beginRendering)) {
        requireSurfaceId(
          message.beginRendering.surfaceId,
          `messages[${index}].beginRendering.surfaceId`,
          errors,
          allowedSurfaces
        );
      }
    });
  }

  return { ok: errors.length === 0, errors };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, path, errors, options = {}) {
  if (value === undefined || value === null) {
    errors.push({
      code: "missing_required",
      path,
      message: "Missing required string",
    });
    return;
  }
  if (typeof value !== "string") {
    errors.push({
      code: "invalid_type",
      path,
      message: "Expected string",
    });
    return;
  }
  if (options.equals && value !== options.equals) {
    errors.push({
      code: "invalid_value",
      path,
      message: "Unexpected value",
    });
  }
}

function requireBoolean(value, path, errors) {
  if (value === undefined || value === null) {
    errors.push({
      code: "missing_required",
      path,
      message: "Missing required boolean",
    });
    return;
  }
  if (typeof value !== "boolean") {
    errors.push({
      code: "invalid_type",
      path,
      message: "Expected boolean",
    });
  }
}

function requireArray(value, path, errors, options = {}) {
  if (value === undefined || value === null) {
    errors.push({
      code: "missing_required",
      path,
      message: "Missing required array",
    });
    return;
  }
  if (!Array.isArray(value)) {
    errors.push({
      code: "invalid_type",
      path,
      message: "Expected array",
    });
    return;
  }
  if (options.minLength !== undefined && value.length < options.minLength) {
    errors.push({
      code: "invalid_value",
      path,
      message: "Array length too small",
    });
  }
}

function requireStringArray(value, path, errors, options = {}) {
  requireArray(value, path, errors, options);
  if (!Array.isArray(value)) {
    return;
  }
  const invalidIndex = value.findIndex((item) => typeof item !== "string");
  if (invalidIndex !== -1) {
    errors.push({
      code: "invalid_type",
      path,
      message: "Expected array of strings",
    });
  }
}

function requireSurfaceId(value, path, errors, allowedSurfaces) {
  if (value === undefined || value === null) {
    errors.push({
      code: "missing_required",
      path,
      message: "Missing required surfaceId",
    });
    return;
  }
  if (typeof value !== "string") {
    errors.push({
      code: "invalid_type",
      path,
      message: "Expected surfaceId string",
    });
    return;
  }
  if (!allowedSurfaces.includes(value)) {
    errors.push({
      code: "invalid_value",
      path,
      message: "Surface not allowed in preview",
    });
  }
}

module.exports = {
  safeParseJson,
  validateUiManifest,
  validatePreviewBundle,
};

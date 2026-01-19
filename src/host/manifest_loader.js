const fs = require("node:fs");
const { safeParseJson, validateUiManifest } = require("../validation/index.js");

function loadManifestFromFile(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "manifest_read_failed",
        message: error instanceof Error ? error.message : "Failed to read manifest",
      },
    };
  }

  const parsed = safeParseJson(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        code: "manifest_parse_failed",
        message: parsed.error.message,
      },
    };
  }

  const validation = validateUiManifest(parsed.value);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: "manifest_invalid",
        message: "Manifest failed validation",
        details: validation.errors,
      },
    };
  }

  return { ok: true, value: parsed.value };
}

module.exports = {
  loadManifestFromFile,
};

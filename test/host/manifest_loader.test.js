const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const { loadManifestFromFile } = require("../../src/host/manifest_loader.js");
const { renderPreviewFromManifest } = require("../../src/host/preview_renderer.js");

const vectorsDir = path.resolve(__dirname, "../test_vectors");

function vectorPath(fileName) {
  return path.join(vectorsDir, fileName);
}

test("loadManifestFromFile loads a valid manifest", () => {
  const result = loadManifestFromFile(vectorPath("manifest.valid.min.json"));
  assert.equal(result.ok, true);
  assert.equal(result.value.manifestVersion, "2");
});

test("loadManifestFromFile rejects an invalid manifest", () => {
  const result = loadManifestFromFile(vectorPath("manifest.invalid.missing_type.json"));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "manifest_invalid");
});

test("renderPreviewFromManifest renders preview bundle from manifest", () => {
  const result = loadManifestFromFile(vectorPath("manifest.valid.min.json"));
  assert.equal(result.ok, true);

  const preview = renderPreviewFromManifest(result.value);
  assert.equal(preview.ok, true);
  assert.equal(preview.renderPlan.surfaceId, "preview");
});

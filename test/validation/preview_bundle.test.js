const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  safeParseJson,
  validatePreviewBundle,
} = require("../../src/validation/index.js");

const vectorsDir = path.resolve(__dirname, "../test_vectors");

function loadVector(fileName) {
  return fs.readFileSync(path.join(vectorsDir, fileName), "utf8");
}

test("validatePreviewBundle accepts preview surface", () => {
  const json = loadVector("preview.good.json");
  const parsed = safeParseJson(json);
  assert.equal(parsed.ok, true);
  const result = validatePreviewBundle(parsed.value);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("validatePreviewBundle rejects non-preview surface", () => {
  const json = loadVector("preview.bad_surface.json");
  const parsed = safeParseJson(json);
  assert.equal(parsed.ok, true);
  const result = validatePreviewBundle(parsed.value);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path.includes("surfaceId")));
});

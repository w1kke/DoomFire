const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
  safeParseJson,
  validateUiManifest,
} = require("../../src/validation/index.js");

const vectorsDir = path.resolve(__dirname, "../test_vectors");

function loadVector(fileName) {
  return fs.readFileSync(path.join(vectorsDir, fileName), "utf8");
}

test("safeParseJson reports invalid JSON", () => {
  const result = safeParseJson("{ invalid");
  assert.equal(result.ok, false);
  assert.equal(result.error?.code, "invalid_json");
  assert.equal(typeof result.error?.message, "string");
});

test("validateUiManifest accepts minimal valid manifest", () => {
  const json = loadVector("manifest.valid.min.json");
  const parsed = safeParseJson(json);
  assert.equal(parsed.ok, true);
  const result = validateUiManifest(parsed.value);
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test("validateUiManifest rejects missing type", () => {
  const json = loadVector("manifest.invalid.missing_type.json");
  const parsed = safeParseJson(json);
  assert.equal(parsed.ok, true);
  const result = validateUiManifest(parsed.value);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.path === "type"));
});

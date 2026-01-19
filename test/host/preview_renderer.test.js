const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const { createHost } = require("../../src/host/host.js");
const { renderPreview } = require("../../src/host/preview_renderer.js");
const { safeParseJson } = require("../../src/validation/index.js");

const vectorsDir = path.resolve(__dirname, "../test_vectors");

function loadVector(fileName) {
  return fs.readFileSync(path.join(vectorsDir, fileName), "utf8");
}

function makeBundleWithComponent(component) {
  return {
    a2uiVersion: "0.8",
    encoding: "json-array",
    messages: [
      {
        surfaceUpdate: {
          surfaceId: "preview",
          components: [{ id: "root", component }],
        },
      },
      { beginRendering: { surfaceId: "preview", root: "root" } },
    ],
  };
}

test("renderPreview builds a render plan for a valid preview bundle", () => {
  const json = loadVector("preview.good.json");
  const parsed = safeParseJson(json);
  assert.equal(parsed.ok, true);

  const result = renderPreview(parsed.value);
  assert.equal(result.ok, true);
  assert.equal(result.renderPlan.surfaceId, "preview");
  assert.equal(result.renderPlan.rootId, "root");
  assert.ok(result.renderPlan.components.root);
});

test("renderPreview returns a safe fallback when bundle is invalid", () => {
  const json = loadVector("preview.bad_surface.json");
  const parsed = safeParseJson(json);
  assert.equal(parsed.ok, true);

  const result = renderPreview(parsed.value);
  assert.equal(result.ok, false);
  assert.equal(result.fallback.kind, "placeholder");
});

test("renderPreview does not start a live session", () => {
  const json = loadVector("preview.good.json");
  const parsed = safeParseJson(json);
  assert.equal(parsed.ok, true);

  const host = createHost();
  host.renderPreview(parsed.value);
  assert.equal(host.isLive(), false);
});

test("preview sandbox blocks external link actions", () => {
  const bundle = makeBundleWithComponent({
    Button: {
      label: { literalString: "Open" },
      action: { OpenUrl: { url: "https://example.com" } },
    },
  });

  const result = renderPreview(bundle);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "external_link_disallowed"));
});

test("preview sandbox blocks wallet intents", () => {
  const bundle = makeBundleWithComponent({
    Button: {
      label: { literalString: "Pay" },
      action: { WalletIntent: { chainId: "eip155:1" } },
    },
  });

  const result = renderPreview(bundle);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "wallet_intent_disallowed"));
});

test("preview sandbox blocks remote media URLs", () => {
  const bundle = makeBundleWithComponent({
    Image: {
      source: { uri: "https://example.com/preview.png" },
      altText: { literalString: "Preview" },
    },
  });

  const result = renderPreview(bundle);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === "network_disallowed"));
});

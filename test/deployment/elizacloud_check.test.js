const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const rootDir = path.resolve(__dirname, "../..");

test("ElizaCloud feasibility check is documented", () => {
  const statusPath = path.join(rootDir, "artifacts", "deployment_check.json");
  const docPath = path.join(rootDir, "docs", "12_elizacloud_check.md");

  const raw = fs.readFileSync(statusPath, "utf8");
  const status = JSON.parse(raw);

  assert.ok(["elizacloud_supported", "vm_fallback"].includes(status.status));

  const doc = fs.readFileSync(docPath, "utf8");
  assert.match(doc, /Status:\s*(elizacloud_supported|vm_fallback)/);

  if (status.status === "vm_fallback") {
    assert.match(doc, /VM fallback/i);
  }
});

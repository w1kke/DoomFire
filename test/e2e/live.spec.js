const { test, expect } = require("@playwright/test");

test("live session starts on explicit open and renders agent UI", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await page.getByRole("button", { name: "Open" }).click();

  await expect(page.locator("#live-badge")).toBeVisible();
  await expect(page.getByText("Live: Cozy DoomFire")).toBeVisible();
});

test("live UI hides when agent endpoint is unreachable", async ({ page }) => {
  const badEndpoint = encodeURIComponent("http://127.0.0.1:1");
  await page.goto(
    `/?manifest=test/test_vectors/manifest.preview.good.json&agentEndpoint=${badEndpoint}`
  );

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes("/api/live/start") &&
        res.request().method() === "POST"
    ),
    page.getByRole("button", { name: "Open" }).click(),
  ]);

  const requestBody = response.request().postDataJSON
    ? response.request().postDataJSON()
    : JSON.parse(response.request().postData() || "{}");
  expect(requestBody.agentEndpoint).toBe("http://127.0.0.1:1");

  const payload = await response.json();
  expect(payload.ok).toBe(false);

  await expect(page.locator("#live-badge")).toBeHidden();
  await expect(page.locator("#live-error")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: "Ignite" })).toHaveCount(0);
});

test("doomfire canvas renders non-empty pixels", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await page.getByRole("button", { name: "Open" }).click();
  const canvas = page.locator("canvas.doomfire-canvas");
  await expect(canvas).toBeVisible();

  await page.waitForFunction(() => {
    const node = document.querySelector("canvas.doomfire-canvas");
    if (!node) return false;
    const ctx = node.getContext("2d");
    if (!ctx) return false;
    const width = node.width || 0;
    const height = node.height || 0;
    if (width === 0 || height === 0) return false;
    const row = ctx.getImageData(0, height - 1, width, 1).data;
    for (let i = 0; i < row.length; i += 4) {
      if (row[i] > 0 || row[i + 1] > 0 || row[i + 2] > 0) {
        return true;
      }
    }
    return false;
  });
});

test("ignite applies updated fire settings to the canvas", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await page.getByRole("button", { name: "Open" }).click();
  await page.waitForFunction(() => {
    const node = document.querySelector("canvas.doomfire-canvas");
    if (!node || !node.dataset.frameHash) return false;
    const ctx = node.getContext("2d");
    if (!ctx) return false;
    const width = node.width || 0;
    const height = node.height || 0;
    if (width === 0 || height === 0) return false;
    const row = ctx.getImageData(0, height - 1, width, 1).data;
    for (let i = 0; i < row.length; i += 4) {
      if (row[i] > 0 || row[i + 1] > 0 || row[i + 2] > 0) {
        return true;
      }
    }
    return false;
  });

  await page.getByRole("button", { name: "Copper Blue" }).click();
  const beforeHash = await getCanvasHash(page);

  await page.getByRole("button", { name: "Ignite" }).click();
  await page.waitForFunction(
    (previous) => {
      const node = document.querySelector("canvas.doomfire-canvas");
      if (!node || !node.dataset.frameHash) return false;
      return node.dataset.frameHash !== previous;
    },
    beforeHash
  );

  const afterHash = await getCanvasHash(page);
  expect(afterHash).not.toBe(beforeHash);
});

async function getCanvasHash(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas.doomfire-canvas");
    if (!canvas) return "";
    return canvas.dataset.frameHash || "";
  });
}

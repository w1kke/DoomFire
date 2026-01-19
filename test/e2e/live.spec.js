const { test, expect } = require("@playwright/test");

test("live session starts on explicit open and renders agent UI", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await page.getByRole("button", { name: "Open" }).click();

  await expect(page.locator("#live-badge")).toBeVisible();
  await expect(page.getByText("Live: Cozy DoomFire")).toBeVisible();
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

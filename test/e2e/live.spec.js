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

test("ignite applies updated fire settings to the canvas", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await page.getByRole("button", { name: "Open" }).click();
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

  await page.getByRole("button", { name: "Copper Blue" }).click();
  const before = await getAverageRgb(page);
  expect(before.r).toBeGreaterThan(before.b);

  await page.getByRole("button", { name: "Ignite" }).click();
  await page.waitForTimeout(500);

  const after = await getAverageRgb(page);
  expect(after.b).toBeGreaterThan(after.r);
  expect(after.b).toBeGreaterThan(before.b);
});

async function getAverageRgb(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas.doomfire-canvas");
    if (!canvas) return { r: 0, g: 0, b: 0 };
    const ctx = canvas.getContext("2d");
    if (!ctx) return { r: 0, g: 0, b: 0 };
    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return { r: 0, g: 0, b: 0 };
    const data = ctx.getImageData(0, 0, width, height).data;
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let pixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      pixels += 1;
    }
    if (pixels === 0) {
      return { r: 0, g: 0, b: 0 };
    }
    return {
      r: totalR / pixels,
      g: totalG / pixels,
      b: totalB / pixels,
    };
  });
}

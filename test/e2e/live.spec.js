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

  await page.locator('input[data-control="intensity"]').evaluate((node) => {
    node.value = "0.1";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });

  const baseline = await getAverageBrightness(page);

  await page.route("**/api/live/event", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON();
    if (payload?.event?.payload?.intensity !== 0.1) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: { code: "bad_intensity" } }),
      });
      return;
    }
    const body = JSON.stringify({
      ok: true,
      updates: [
        { narration: { phase: "collecting", text: "Collecting kindling...", stepIndex: 1 } },
        {
          applied: {
            presetId: "cozy_amber",
            size: 0.4,
            intensity: 0.1,
            heat: 0.1,
            seed: 1337,
          },
        },
      ],
    });
    await route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await page.getByRole("button", { name: "Ignite" }).click();
  await page.waitForTimeout(300);

  const updated = await getAverageBrightness(page);
  expect(updated).toBeLessThan(baseline * 0.9);
});

async function getAverageBrightness(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas.doomfire-canvas");
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return 0;
    const data = ctx.getImageData(0, 0, width, height).data;
    let total = 0;
    let pixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      total += (data[i] + data[i + 1] + data[i + 2]) / 3;
      pixels += 1;
    }
    return pixels === 0 ? 0 : total / pixels;
  });
}

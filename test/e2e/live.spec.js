const { test, expect } = require("@playwright/test");
const {
  waitForTestHook,
  openLive,
  getStaged,
  getApplied,
  getNarrationPhase,
  getCanvasHash,
  setSlider,
} = require("./doomfire_utils");

test("No agent => no live UI", async ({ page }) => {
  const badEndpoint = encodeURIComponent("http://127.0.0.1:1");
  await page.goto(
    `/?manifest=test/test_vectors/manifest.preview.good.json&agentEndpoint=${badEndpoint}`
  );
  await waitForTestHook(page);

  await page.getByTestId("open-live").click();

  await expect(page.getByTestId("live-error")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("live-badge")).toBeHidden();
  await expect(page.getByTestId("ignite-button")).toHaveCount(0);

  const liveChildren = await page
    .getByTestId("live-root")
    .evaluate((node) => node.children.length);
  expect(liveChildren).toBe(0);

  const applied = await getApplied(page);
  expect(applied).toBeNull();

  await page.getByTestId("open-live").click();
  await expect(page.getByTestId("live-error")).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId("ignite-button")).toHaveCount(0);
});

test("Ignite applies settings and changes the fire palette", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");
  await waitForTestHook(page);
  await openLive(page);

  await expect(page.getByTestId("doomfire-canvas")).toBeVisible();
  await expect(page.getByTestId("narration-text")).toBeVisible();

  await expect.poll(async () => getCanvasHash(page)).not.toBe("");
  const baselineHash = await getCanvasHash(page);
  const baselineApplied = await getApplied(page);
  expect(baselineApplied).not.toBeNull();

  await page.getByTestId("preset-copper_blue").click();
  await setSlider(page, "control-size", 0.9);
  await setSlider(page, "control-intensity", 0.8);
  await setSlider(page, "control-heat", 0.25);

  const staged = await getStaged(page);
  expect(staged).toMatchObject({
    presetId: "copper_blue",
    size: 0.9,
    intensity: 0.8,
    heat: 0.25,
  });

  const narrationBefore =
    (await page.getByTestId("narration-text").textContent()) || "";
  const phaseBefore = await getNarrationPhase(page);

  await page.getByTestId("ignite-button").click();

  await expect.poll(async () => getNarrationPhase(page)).not.toBe(phaseBefore);
  await expect
    .poll(async () => (await page.getByTestId("narration-text").textContent()) || "")
    .not.toBe(narrationBefore);

  await expect.poll(async () => getApplied(page)).toMatchObject(staged);
  await expect.poll(async () => getCanvasHash(page)).not.toBe(baselineHash);
});

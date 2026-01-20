const { test, expect } = require("@playwright/test");
const {
  waitForTestHook,
  openLive,
  getStaged,
  getApplied,
  getCanvasHash,
  setSlider,
} = require("./doomfire_utils");

test("Reset returns to defaults", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");
  await waitForTestHook(page);
  await openLive(page);

  await expect.poll(async () => getApplied(page)).not.toBeNull();
  const defaults = await getApplied(page);
  await expect.poll(async () => getCanvasHash(page)).not.toBe("");
  const defaultHash = await getCanvasHash(page);

  await page.getByTestId("preset-neon_lime").click();
  await setSlider(page, "control-size", 0.9);
  await setSlider(page, "control-intensity", 0.75);
  await setSlider(page, "control-heat", 0.2);

  const staged = await getStaged(page);
  await page.getByTestId("ignite-button").click();
  await expect.poll(async () => getApplied(page)).toMatchObject(staged);

  const appliedAfterIgnite = await getApplied(page);
  expect(appliedAfterIgnite).not.toMatchObject(defaults);

  await page.getByTestId("reset-button").click();

  const stagedAfterReset = await getStaged(page);
  expect(stagedAfterReset).toMatchObject(defaults);

  const appliedAfterReset = await getApplied(page);
  expect(appliedAfterReset).not.toMatchObject(defaults);

  await page.getByTestId("ignite-button").click();
  await expect.poll(async () => getApplied(page)).toMatchObject(defaults);
  await expect.poll(async () => getCanvasHash(page)).toBe(defaultHash);
});

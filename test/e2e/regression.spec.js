const { test, expect } = require("@playwright/test");
const {
  waitForTestHook,
  openLive,
  getApplied,
  getCanvasHash,
} = require("./doomfire_utils");

test("No console errors / unhandled rejections", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");
  await waitForTestHook(page);
  await openLive(page);

  await expect(page.getByTestId("doomfire-canvas")).toBeVisible();
  await expect.poll(async () => getCanvasHash(page)).not.toBe("");

  await page.getByTestId("preset-rose_quartz").click();
  await page.getByTestId("ignite-button").click();
  await expect.poll(async () => getApplied(page)).not.toBeNull();

  await page.getByTestId("audio-toggle").click();
  await page.getByTestId("audio-toggle").click();

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

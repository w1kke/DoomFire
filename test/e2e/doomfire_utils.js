const { expect } = require("@playwright/test");

async function waitForTestHook(page) {
  await page.waitForFunction(() => window.__doomfireTest !== undefined);
}

async function openLive(page) {
  await page.getByTestId("open-live").click();
  await expect(page.getByTestId("live-badge")).toBeVisible();
}

async function getStaged(page) {
  return page.evaluate(() => window.__doomfireTest?.getStaged() ?? null);
}

async function getApplied(page) {
  return page.evaluate(() => window.__doomfireTest?.getApplied() ?? null);
}

async function getNarrationPhase(page) {
  return page.evaluate(() => window.__doomfireTest?.getNarrationPhase() ?? "");
}

async function getAudioState(page) {
  return page.evaluate(() => window.__doomfireTest?.getAudioState() ?? null);
}

async function getCanvasHash(page) {
  return page.evaluate(() => window.__doomfireTest?.getCanvasHash() ?? "");
}

async function setSlider(page, testId, value) {
  const slider = page.getByTestId(testId);
  await slider.evaluate((node, nextValue) => {
    node.value = String(nextValue);
    node.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

module.exports = {
  waitForTestHook,
  openLive,
  getStaged,
  getApplied,
  getNarrationPhase,
  getAudioState,
  getCanvasHash,
  setSlider,
};

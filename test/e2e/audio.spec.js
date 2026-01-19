const { test, expect } = require("@playwright/test");

test("audio starts only after explicit audio toggle", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await page.getByRole("button", { name: "Open" }).click();

  const afterOpen = await page.evaluate(() => window.__audioState || null);
  if (afterOpen) {
    expect(afterOpen.enabled).toBeFalsy();
    expect(afterOpen.playing).toBeFalsy();
  }

  await page.getByRole("button", { name: "Audio" }).click();

  await page.waitForFunction(() => {
    return (
      window.__audioState &&
      window.__audioState.enabled === true &&
      window.__audioState.playing === true
    );
  });

  const afterToggle = await page.evaluate(() => window.__audioState);
  expect(afterToggle.enabled).toBe(true);
  expect(afterToggle.playing).toBe(true);
});

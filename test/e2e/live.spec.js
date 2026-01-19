const { test, expect } = require("@playwright/test");

test("live session starts on explicit open and renders agent UI", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await page.getByRole("button", { name: "Open" }).click();

  await expect(page.locator("#live-badge")).toBeVisible();
  await expect(page.getByText("Live: Cozy DoomFire")).toBeVisible();
});

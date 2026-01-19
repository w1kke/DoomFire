const { test, expect } = require("@playwright/test");

test("preview renders without starting live session", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");

  await expect(page.getByText("Cozy DoomFire")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
  await expect(page.locator("#live-badge")).toBeHidden();
});

test("preview sandbox shows fallback on disallowed payload", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.bad.json");

  await expect(page.locator("#preview-fallback")).toBeVisible();
});

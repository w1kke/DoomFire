const { test, expect } = require("@playwright/test");
const { waitForTestHook } = require("./doomfire_utils");

test("Preview renders safely", async ({ page }) => {
  const requests = [];
  const popups = [];
  page.on("request", (request) => {
    requests.push(request.url());
  });
  page.on("popup", (popup) => {
    popups.push(popup);
  });

  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");
  await waitForTestHook(page);

  await expect(page.getByTestId("preview-root")).toBeVisible();
  await expect(page.getByTestId("open-live")).toBeVisible();
  await expect(page.getByTestId("preview-fallback")).toBeHidden();
  await expect(page.getByTestId("live-badge")).toBeHidden();

  const hostOrigin = new URL(page.url()).origin;
  const externalRequests = requests.filter((requestUrl) => {
    const url = new URL(requestUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    return url.origin !== hostOrigin;
  });
  expect(externalRequests).toEqual([]);
  expect(popups).toHaveLength(0);

  const linkCount = await page
    .getByTestId("preview-root")
    .evaluate((node) =>
      Array.from(node.getElementsByTagName("a")).filter((link) =>
        link.getAttribute("href")
      ).length
    );
  expect(linkCount).toBe(0);

  const liveChildren = await page
    .getByTestId("live-root")
    .evaluate((node) => node.children.length);
  expect(liveChildren).toBe(0);

  const applied = await page.evaluate(
    () => window.__doomfireTest?.getApplied() ?? null
  );
  expect(applied).toBeNull();
});

test("Preview sandbox shows fallback on disallowed payload", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.bad.json");
  await waitForTestHook(page);

  await expect(page.getByTestId("preview-fallback")).toBeVisible();

  const applied = await page.evaluate(
    () => window.__doomfireTest?.getApplied() ?? null
  );
  expect(applied).toBeNull();
});

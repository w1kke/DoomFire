const { test, expect } = require("@playwright/test");
const { waitForTestHook, openLive, getAudioState } = require("./doomfire_utils");

test("Audio is opt-in and toggle works", async ({ page }) => {
  await page.goto("/?manifest=test/test_vectors/manifest.preview.good.json");
  await waitForTestHook(page);
  await openLive(page);

  await expect(page.getByTestId("audio-toggle")).toBeVisible();
  const initial = await getAudioState(page);
  expect(initial).toMatchObject({ enabled: false, isPlaying: false });

  await page.getByTestId("audio-toggle").click();
  await expect.poll(async () => getAudioState(page)).toMatchObject({
    enabled: true,
    isPlaying: true,
  });

  await page.getByTestId("audio-toggle").click();
  await expect.poll(async () => getAudioState(page)).toMatchObject({
    enabled: false,
    isPlaying: false,
  });
});

import { test, expect } from "@playwright/test";

test("offline reload still renders the app shell from cache", async ({ page, context }) => {
  await page.goto("/match/sim-2026-final-chase");
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Give the SW a moment to finish caching the navigation response.
  await page.waitForTimeout(1000);

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator("body")).toBeVisible();
  const text = await page.locator("body").innerText();
  expect(text.length).toBeGreaterThan(0);

  await context.setOffline(false);
});

import { test, expect } from "@playwright/test";

test("spoiler shield calibration records a delay from two taps", async ({ page }) => {
  await page.goto("/match/sim-2026-final-chase");
  await page.getByRole("button", { name: "8x" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Calibrate my delay" }).click();

  const tapButton = page.getByRole("button", { name: /Tap now!|Waiting for the next moment/ });
  for (let i = 0; i < 2; i += 1) {
    await expect(tapButton).toHaveText("Tap now!", { timeout: 30_000 });
    // Simulate a human reaction delay — an instant bot click would round to 0s, which is valid
    // app behavior ("No delay set") but not what this test is checking.
    await page.waitForTimeout(1200);
    await tapButton.click();
  }

  await expect(page.getByText(/seconds behind/)).toBeVisible();
});

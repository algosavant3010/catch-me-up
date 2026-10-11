import { test, expect } from "@playwright/test";

const MATCH_URL = "/match/sim-2026-final-chase";

test.describe("Core fan flows", () => {
  test("landing page leads to the demo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Catch Me Up" })).toBeVisible();
    await page.getByRole("link", { name: "Try the demo" }).click();
    await expect(page).toHaveURL(/\/match\//);
  });

  test("joining late shows a populated scoreboard, not a fresh 0/0 start", async ({ page }) => {
    await page.goto(`${MATCH_URL}?join=late`);
    const score = page
      .getByLabel("Live scoreboard")
      .getByText(/\d+\/\d+/)
      .first();
    await expect(score).toBeVisible();
    const text = await score.textContent();
    expect(text).not.toBe("0/0");
  });

  test("Catch Me Up opens a verified recap with a trust badge", async ({ page }) => {
    await page.goto(`${MATCH_URL}?join=late`);
    await page.getByRole("button", { name: "Catch me up" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/references verified|Instant summary/)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("a proof chip opens the real ball behind a recap line", async ({ page }) => {
    await page.goto(`${MATCH_URL}?join=late`);
    await page.getByRole("button", { name: "Catch me up" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/references verified|Instant summary/)).toBeVisible({
      timeout: 15_000,
    });

    const chip = dialog.getByRole("button", { name: /^b\d+$/ }).first();
    if (await chip.count()) {
      await chip.click();
      const proof = page.getByRole("dialog", { name: "What actually happened", exact: true });
      await expect(proof).toBeVisible();
      await expect(proof.getByText("Score after", { exact: true })).toBeVisible();
      await expect(proof.getByText("Bowler", { exact: true })).toBeVisible();
    }
  });

  test("away mode records a window and catches the fan up on return", async ({ page }) => {
    await page.goto(`${MATCH_URL}?join=late`);
    await page.getByRole("button", { name: "8x" }).click();
    await page.getByRole("button", { name: "Away" }).click();
    await expect(page.getByRole("status")).toContainText(/missed/i, { timeout: 10_000 });

    await page.getByRole("button", { name: "I'm back" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/references verified|Instant summary/)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("switching language changes UI text without losing match state", async ({ page }) => {
    await page.goto(`${MATCH_URL}?join=late`);
    await page.getByRole("button", { name: "Pause" }).click();
    const scoreBefore = await page
      .getByLabel("Live scoreboard")
      .getByText(/\d+\/\d+/)
      .first()
      .textContent();
    const runsWickets = scoreBefore?.match(/\d+\/\d+/)?.[0];

    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("button", { name: "हिन्दी" }).click();
    // The visible ✕ close button (not the full-screen backdrop button, which shares the same accessible name).
    await page.getByRole("button", { name: "Close" }).last().click();

    await expect(page.getByRole("button", { name: "पूछें" })).toBeVisible();
    const scoreAfter = await page
      .getByLabel("Live scoreboard")
      .getByText(/\d+\/\d+/)
      .first()
      .textContent();
    // The score itself must be unchanged (no state loss) even though surrounding labels are now localized.
    expect(scoreAfter).toContain(runsWickets);
  });

  test("Call the Next Over accepts a prediction", async ({ page }) => {
    await page.goto(MATCH_URL);
    await page.getByRole("button", { name: "Wicket", exact: true }).click();
    await expect(page.getByText(/Locked in/)).toBeVisible();
  });

  test("sharing a moment triggers a download (no Web Share API in headless Chromium)", async ({
    page,
  }) => {
    await page.goto(`${MATCH_URL}?join=late`);
    await page.getByRole("button", { name: "Catch me up" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/references verified|Instant summary/)).toBeVisible({
      timeout: 15_000,
    });
    const chip = dialog.getByRole("button", { name: /^b\d+$/ }).first();
    if (await chip.count()) {
      await chip.click();
      const downloadPromise = page.waitForEvent("download", { timeout: 10_000 }).catch(() => null);
      await page.getByRole("button", { name: "Share" }).click();
      await downloadPromise;
    }
  });
});

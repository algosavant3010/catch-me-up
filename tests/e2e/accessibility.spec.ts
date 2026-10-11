import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility (axe)", () => {
  for (const theme of ["light", "dark"]) {
    test(`settings and question form are accessible in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme as "light" | "dark", reducedMotion: "reduce" });
      await page.goto("/match/sim-2026-final-chase?join=late");
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      const settings = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
      expect(
        settings.violations.filter(
          (issue) => issue.impact === "serious" || issue.impact === "critical",
        ),
      ).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeFocused();
      await page.getByRole("button", { name: "Ask", exact: true }).click();
      await expect(page.getByLabel("Your question")).toBeVisible();
      const question = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
      expect(
        question.violations.filter(
          (issue) => issue.impact === "serious" || issue.impact === "critical",
        ),
      ).toEqual([]);
    });
  }

  test("both routes fit narrow mobile, tablet, and desktop viewports", async ({ page }) => {
    test.setTimeout(90_000);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/match/sim-2026-final-chase?join=late"]) {
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        ).toBe(true);
      }
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      expect(
        await page
          .getByRole("dialog")
          .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
      ).toBe(true);
      await page.keyboard.press("Escape");
    }
  });
  test("landing page has no serious violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    if (serious.length > 0) {
      console.log(JSON.stringify(serious, null, 2));
    }
    expect(serious).toEqual([]);
  });

  test("match page has no serious violations", async ({ page }) => {
    await page.goto("/match/sim-2026-final-chase?join=late");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    if (serious.length > 0) {
      console.log(JSON.stringify(serious, null, 2));
    }
    expect(serious).toEqual([]);
  });
});

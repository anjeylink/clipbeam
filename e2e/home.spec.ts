import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/explorer");
  await expect(page).toHaveTitle(/ClipBeam/i);
});

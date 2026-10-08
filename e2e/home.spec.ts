import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/ClipBeam/i);
});

for (const path of ["/threads-video-downloader", "/uk/threads-video-downloader"]) {
  test(`hero subtext is centered under the heading on ${path}`, async ({ page }) => {
    await page.goto(path);

    const heading = await page.getByRole("heading", { level: 1 }).boundingBox();
    const subtext = await page.locator("h1 + p").boundingBox();
    if (!heading || !subtext) throw new Error("hero heading or subtext is not rendered");

    const headingCenter = heading.x + heading.width / 2;
    const subtextCenter = subtext.x + subtext.width / 2;
    expect(Math.abs(headingCenter - subtextCenter)).toBeLessThan(1);
  });
}

import { test, expect } from "@playwright/test";

test("pastes a video link, previews it, and downloads the selected quality", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel(/X \(Twitter\) post link/i).fill("https://x.com/someone/status/2");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible({
    timeout: 5000,
  });

  const qualityGroup = page.getByRole("radiogroup", { name: /video quality/i });
  await expect(qualityGroup).toBeVisible();
  await page.getByRole("radio", { name: /720p/i }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: /480p/i })).toBeChecked();

  const downloadButton = page.getByRole("button", { name: /^download$/i });
  await expect(downloadButton).toBeEnabled({ timeout: 5000 });
  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/clipbeam-.*\.mp4/);
});

test("shows an inline error for a non-X url without blocking the input", async ({
  page,
}) => {
  await page.goto("/");

  const input = page.getByLabel(/X \(Twitter\) post link/i);
  await input.fill("https://example.com/not-a-post");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByText(/doesn't look like/i)).toBeVisible();
  await expect(input).toHaveValue("https://example.com/not-a-post");
});

import { test, expect } from "@playwright/test";

const VIDEO_FIXTURE = {
  postUrl: "https://x.com/someone/status/2",
  authorHandle: "someone",
  kind: "video",
  posterUrl: "/mock/sample-video-poster.jpg",
  qualities: [
    {
      label: "1080p",
      width: 1920,
      height: 1080,
      url: "/mock/sample-video-1080p.mp4",
      approxSizeMb: 4.8,
    },
    {
      label: "720p",
      width: 1280,
      height: 720,
      url: "/mock/sample-video-720p.mp4",
      approxSizeMb: 2.6,
    },
    {
      label: "480p",
      width: 854,
      height: 480,
      url: "/mock/sample-video-480p.mp4",
      approxSizeMb: 1.3,
    },
  ],
};

test("pastes a video link, previews it, and downloads the selected quality", async ({
  page,
}) => {
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ json: VIDEO_FIXTURE }),
  );

  await page.goto("/");

  await page.getByLabel(/X \(Twitter\) post link/i).fill("https://x.com/someone/status/2");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeVisible({
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

test("surfaces a server-reported error inline (e.g. a deleted or unsupported post)", async ({
  page,
}) => {
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ status: 422, json: { code: "no-media" } }),
  );

  await page.goto("/");

  await page.getByLabel(/X \(Twitter\) post link/i).fill("https://x.com/someone/status/3");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByText(/doesn't have an image or video/i)).toBeVisible({
    timeout: 5000,
  });
});

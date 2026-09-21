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

test("pastes a video link, previews it, and links Download to the selected quality", async ({
  page,
}) => {
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ json: VIDEO_FIXTURE }),
  );
  // Record any /api/download traffic: nothing should hit the proxy until the
  // user actually clicks Download (this browser has no Web Share file support,
  // so there's no reason to prefetch the file into memory).
  const downloadRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/download")) downloadRequests.push(request.url());
  });

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

  // Download is a plain link to the streaming proxy: available immediately
  // (no "Preparing…" wait), pointing at the selected quality. The attachment
  // header itself is covered by the /api/download route tests.
  const downloadLink = page.getByRole("link", { name: /^download$/i });
  await expect(downloadLink).toBeVisible();
  const href = await downloadLink.getAttribute("href");
  const linked = new URL(href!, page.url());
  expect(linked.pathname).toBe("/api/download");
  expect(linked.searchParams.get("url")).toBe("/mock/sample-video-480p.mp4");
  expect(linked.searchParams.get("filename")).toBe("clipbeam-someone-480p");
  await expect(downloadLink).toHaveAttribute("target", "_blank");
  await expect(downloadLink).not.toHaveAttribute("download");
  // Same height as a Button (h-12), not the h-8 the base size variant would add.
  expect((await downloadLink.boundingBox())?.height).toBe(48);
  expect(downloadRequests).toEqual([]);
});

test("on a Web Share-capable browser, prefetches the file for Share while Download stays instant", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(navigator, {
      canShare: () => true,
      share: () => Promise.resolve(),
    });
  });
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ json: VIDEO_FIXTURE }),
  );
  const downloadRequests: string[] = [];
  let releaseBlob!: () => void;
  const blobGate = new Promise<void>((resolve) => (releaseBlob = resolve));
  await page.route("**/api/download*", async (route) => {
    downloadRequests.push(route.request().url());
    await blobGate;
    await route.fulfill({ headers: { "content-type": "video/mp4" }, body: "fake-video-bytes" });
  });

  await page.goto("/");
  await page.getByLabel(/X \(Twitter\) post link/i).fill("https://x.com/someone/status/2");
  await page.getByRole("button", { name: /get media/i }).click();

  // While the blob is still in flight: Share is "Preparing…", Download is live.
  const shareButton = page.getByRole("button", { name: /preparing/i });
  await expect(shareButton).toBeDisabled({ timeout: 5000 });
  await expect(page.getByRole("link", { name: /^download$/i })).toBeVisible();
  expect(downloadRequests).toHaveLength(1);
  expect(new URL(downloadRequests[0]).searchParams.get("url")).toBe(
    "/mock/sample-video-720p.mp4",
  );

  releaseBlob();
  await expect(page.getByRole("button", { name: /^share$/i })).toBeEnabled({ timeout: 5000 });
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

import { test, expect } from "@playwright/test";

// Mirrors what /api/resolve returns (ParsedMedia): every media URL is
// already routed through the /api/download proxy.
function proxied(path: string): string {
  return `/api/download?${new URLSearchParams({ url: path })}`;
}

const VIDEO_FIXTURE = {
  platform: "x",
  postUrl: "https://x.com/someone/status/2",
  authorHandle: "someone",
  kind: "video",
  posterUrl: "/mock/sample-video-poster.jpg",
  qualities: [
    {
      label: "1080p",
      width: 1920,
      height: 1080,
      proxiedUrl: proxied("/mock/sample-video-1080p.mp4"),
      approxSizeMb: 4.8,
    },
    {
      label: "720p",
      width: 1280,
      height: 720,
      proxiedUrl: proxied("/mock/sample-video-720p.mp4"),
      approxSizeMb: 2.6,
    },
    {
      label: "480p",
      width: 854,
      height: 480,
      proxiedUrl: proxied("/mock/sample-video-480p.mp4"),
      approxSizeMb: 1.3,
    },
  ],
};

// A Threads embed gives no dimensions or poster: one unlabelled quality.
const THREADS_VIDEO_FIXTURE = {
  platform: "threads",
  postUrl: "https://www.threads.com/@someone/post/ABC123",
  authorHandle: "someone",
  kind: "video",
  qualities: [
    {
      label: null,
      width: 0,
      height: 0,
      proxiedUrl: proxied("/mock/sample-video-720p.mp4"),
      approxSizeMb: 3.9,
    },
  ],
};

const THREADS_IMAGE_FIXTURE = {
  platform: "threads",
  postUrl: "https://www.threads.com/@someone/post/IMG456",
  authorHandle: "someone",
  kind: "image",
  previewUrl: proxied("/mock/sample-image.jpg"),
  proxiedUrl: proxied("/mock/sample-image.jpg"),
};

const POST_LINK_LABEL = /post link/i;

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
  // The <video> preview streams through the proxy too (resource type
  // "media"); only a fetch() of the whole file would be a prefetch.
  page.on("request", (request) => {
    if (request.url().includes("/api/download") && request.resourceType() !== "media") {
      downloadRequests.push(request.url());
    }
  });

  await page.goto("/");

  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
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
    // Let the <video> preview's own requests through uncounted: only the
    // Share blob prefetch is under test here.
    if (route.request().resourceType() === "media") return route.abort();
    downloadRequests.push(route.request().url());
    await blobGate;
    await route.fulfill({ headers: { "content-type": "video/mp4" }, body: "fake-video-bytes" });
  });

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
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

test("Share hands the OS share sheet only the media file, no title or text", async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(navigator, {
      canShare: () => true,
      share: (data: ShareData) => {
        (window as unknown as { sharedKeys: string[] }).sharedKeys = Object.keys(data);
        return Promise.resolve();
      },
    });
  });
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ json: VIDEO_FIXTURE }),
  );
  await page.route("**/api/download*", (route) =>
    route.request().resourceType() === "media"
      ? route.abort()
      : route.fulfill({ headers: { "content-type": "video/mp4" }, body: "fake-video-bytes" }),
  );

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
  await page.getByRole("button", { name: /get media/i }).click();

  // Messengers like Telegram send any title/text as a second message.
  const shareButton = page.getByRole("button", { name: /^share$/i });
  await expect(shareButton).toBeEnabled({ timeout: 5000 });
  await shareButton.click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { sharedKeys?: string[] }).sharedKeys))
    .toEqual(["files"]);
});

test("on a phone, stacked Share and Download keep their full tap height", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.assign(navigator, {
      canShare: () => true,
      share: () => Promise.resolve(),
    });
  });
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ json: VIDEO_FIXTURE }),
  );
  await page.route("**/api/download*", (route) =>
    route.request().resourceType() === "media"
      ? route.abort()
      : route.fulfill({ headers: { "content-type": "video/mp4" }, body: "fake-video-bytes" }),
  );

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
  await page.getByRole("button", { name: /get media/i }).click();

  // In the mobile column a flex-basis of 0 would collapse both to text height.
  const shareButton = page.getByRole("button", { name: /^share$/i });
  await expect(shareButton).toBeEnabled({ timeout: 5000 });
  expect((await shareButton.boundingBox())?.height).toBe(48);
  expect((await page.getByRole("link", { name: /^download$/i }).boundingBox())?.height).toBe(48);
});

test("shows an inline error for an unsupported url without blocking the input", async ({
  page,
}) => {
  await page.goto("/");

  const input = page.getByLabel(POST_LINK_LABEL);
  await input.fill("https://example.com/not-a-post");
  await page.getByRole("button", { name: /get media/i }).click();

  // Names both supported Platforms, with an example link for each.
  await expect(
    page.getByText(/doesn't look like an X \(Twitter\) or Threads post link/i),
  ).toBeVisible();
  await expect(page.getByText(/threads\.com\/@user\/post/i)).toBeVisible();
  await expect(input).toHaveValue("https://example.com/not-a-post");
});

test("surfaces a server-reported error inline (e.g. a deleted or unsupported post)", async ({
  page,
}) => {
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ status: 422, json: { code: "no-media" } }),
  );

  await page.goto("/");

  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/3");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByText(/doesn't have an image or video/i)).toBeVisible({
    timeout: 5000,
  });
});

test('pastes a Threads video link: one "Original" quality, Download via the proxy', async ({
  page,
}) => {
  const resolveRequests: string[] = [];
  await page.route("**/api/resolve*", (route) => {
    resolveRequests.push(route.request().url());
    return route.fulfill({ json: THREADS_VIDEO_FIXTURE });
  });

  await page.goto("/");
  await page
    .getByLabel(POST_LINK_LABEL)
    .fill("https://www.threads.com/@someone/post/ABC123?xmt=AQG0");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeVisible({
    timeout: 5000,
  });
  expect(new URL(resolveRequests[0]).searchParams.get("url")).toBe(
    "https://www.threads.com/@someone/post/ABC123?xmt=AQG0",
  );
  await expect(page.getByText("@someone")).toBeVisible();

  const onlyQuality = page.getByRole("radio", { name: /original/i });
  await expect(onlyQuality).toBeChecked();
  await expect(page.getByRole("radio")).toHaveCount(1);

  const href = await page.getByRole("link", { name: /^download$/i }).getAttribute("href");
  const linked = new URL(href!, page.url());
  expect(linked.pathname).toBe("/api/download");
  expect(linked.searchParams.get("url")).toBe("/mock/sample-video-720p.mp4");
  expect(linked.searchParams.get("filename")).toBe("clipbeam-someone-original");
});

test("pastes a Threads image link and previews it through the proxy", async ({ page }) => {
  await page.route("**/api/resolve*", (route) => route.fulfill({ json: THREADS_IMAGE_FIXTURE }));

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://www.threads.com/t/IMG456");
  await page.getByRole("button", { name: /get media/i }).click();

  const image = page.getByRole("img", { name: /@someone/i });
  await expect(image).toBeVisible({ timeout: 5000 });
  expect(new URL((await image.getAttribute("src"))!, page.url()).pathname).toBe("/api/download");
  await expect(page.getByRole("radiogroup", { name: /video quality/i })).toHaveCount(0);

  const href = await page.getByRole("link", { name: /^download$/i }).getAttribute("href");
  expect(new URL(href!, page.url()).searchParams.get("filename")).toBe("clipbeam-someone-image");
});

test("names Threads in a rate-limit error for a Threads link", async ({ page }) => {
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ status: 429, json: { code: "rate-limited" } }),
  );

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://www.threads.com/@someone/post/ABC123");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByText(/^Threads is rate-limiting requests/i)).toBeVisible({
    timeout: 5000,
  });
});

test("names X in a rate-limit error for an X link", async ({ page }) => {
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ status: 429, json: { code: "rate-limited" } }),
  );

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/5");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByText(/^X is rate-limiting requests/i)).toBeVisible({
    timeout: 5000,
  });
});

test("rejects a Threads carousel with the multi-media message", async ({ page }) => {
  await page.route("**/api/resolve*", (route) =>
    route.fulfill({ status: 422, json: { code: "multi-media-unsupported" } }),
  );

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://www.threads.com/@someone/post/CAR789");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByText(/multiple photos or videos aren't supported/i)).toBeVisible({
    timeout: 5000,
  });
});

test("accepts a Threads share link instead of rejecting it as invalid", async ({ page }) => {
  const resolveRequests: string[] = [];
  await page.route("**/api/resolve*", (route) => {
    resolveRequests.push(route.request().url());
    return route.fulfill({ json: THREADS_VIDEO_FIXTURE });
  });

  await page.goto("/");
  await page.getByLabel(POST_LINK_LABEL).fill("https://www.threads.com/share/_ob4VZH8D/");
  await page.getByRole("button", { name: /get media/i }).click();

  await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeVisible({
    timeout: 5000,
  });
  expect(new URL(resolveRequests[0]).searchParams.get("url")).toBe(
    "https://www.threads.com/share/_ob4VZH8D/",
  );
});

// ?url= is the source of truth for which post is shown.
test.describe("?url= query param", () => {
  const POST_URL = "https://x.com/someone/status/2";

  test("survives a locale switch without refetching, and restores on reload", async ({
    page,
  }) => {
    const resolveRequests: string[] = [];
    await page.route("**/api/resolve*", (route) => {
      resolveRequests.push(route.request().url());
      return route.fulfill({ json: VIDEO_FIXTURE });
    });

    await page.goto("/");
    await page.getByLabel(POST_LINK_LABEL).fill(POST_URL);
    await page.getByRole("button", { name: /get media/i }).click();
    await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeVisible({
      timeout: 5000,
    });
    expect(new URL(page.url()).searchParams.get("url")).toBe(POST_URL);

    await page
      .getByRole("navigation", { name: /language/i })
      .getByRole("link", { name: "uk" })
      .click();

    await expect(page).toHaveURL(/\/uk(\?|$)/);
    expect(new URL(page.url()).searchParams.get("url")).toBe(POST_URL);
    await expect(page.getByRole("heading", { name: "Перегляд", exact: true })).toBeVisible();
    expect(resolveRequests).toHaveLength(1);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Перегляд", exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByLabel(/посилання на пост/i)).toHaveValue(POST_URL);
  });

  test("a shared link loads the post without submitting", async ({ page }) => {
    await page.route("**/api/resolve*", (route) => route.fulfill({ json: VIDEO_FIXTURE }));

    await page.goto(`/?${new URLSearchParams({ url: POST_URL })}`);

    await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByLabel(POST_LINK_LABEL)).toHaveValue(POST_URL);
  });

  test("navigating home via the logo resets the tool", async ({ page }) => {
    await page.route("**/api/resolve*", (route) => route.fulfill({ json: VIDEO_FIXTURE }));

    await page.goto("/");
    await page.getByLabel(POST_LINK_LABEL).fill(POST_URL);
    await page.getByRole("button", { name: /get media/i }).click();
    await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeVisible({
      timeout: 5000,
    });

    await page.getByRole("link", { name: "ClipBeam" }).click();

    await expect(page.getByRole("heading", { name: "Preview", exact: true })).toBeHidden();
    expect(new URL(page.url()).searchParams.has("url")).toBe(false);
    await expect(page.getByLabel(POST_LINK_LABEL)).toHaveValue("");
  });
});

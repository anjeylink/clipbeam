import { test, expect, type Page } from "@playwright/test";

// Canonical and hreflang URLs are absolute against NEXT_PUBLIC_SITE_URL,
// which may not be the test server's origin: compare paths only.
function pathOf(url: string | null): string {
  return new URL(url!).pathname;
}

async function hreflangPaths(page: Page): Promise<Record<string, string>> {
  const links = page.locator('head link[rel="alternate"][hreflang]');
  const entries = await links.evaluateAll((elements) =>
    elements.map((el) => [el.getAttribute("hreflang")!, el.getAttribute("href")!]),
  );
  return Object.fromEntries(entries.map(([lang, href]) => [lang, pathOf(href)]));
}

test("unknown paths with a dot 404 instead of rendering the home page", async ({
  request,
}) => {
  for (const path of ["/llms.txt", "/apple-touch-icon.png", "/de/og.png"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("the favicon is served for browsers that request it by default", async ({
  request,
}) => {
  const response = await request.get("/favicon.ico");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/x-icon");
});

test("the default locale's prefixed URLs redirect permanently", async ({
  request,
}) => {
  const response = await request.get("/en/terms", { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  const location = new URL(response.headers()["location"], response.url());
  expect(location.pathname).toBe("/terms");
});

test("robots.txt keeps crawlers off the API and points at the sitemap", async ({
  request,
}) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Disallow: /api/");
  expect(body).toMatch(/^Sitemap: .+\/sitemap\.xml$/m);
});

test("the sitemap lists every page in both locales with hreflang", async ({
  request,
}) => {
  const body = await (await request.get("/sitemap.xml")).text();
  for (const path of [
    "/uk",
    "/terms",
    "/uk/terms",
    "/privacy",
    "/uk/dmca",
    "/instagram-video-downloader",
    "/uk/twitter-video-downloader",
    "/threads-video-downloader",
  ]) {
    expect(body).toMatch(new RegExp(`<loc>[^<]+${path}</loc>`));
  }
  expect(body).toContain('hreflang="x-default"');
});

test("every sitemap entry carries the date its page last changed", async ({
  request,
}) => {
  const body = await (await request.get("/sitemap.xml")).text();
  const urls = body.match(/<url>[\s\S]*?<\/url>/g)!;
  expect(urls).toHaveLength(14);
  for (const url of urls) {
    expect(url).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}/);
  }
  // A fixed date, not the time of the request.
  expect(body).toMatch(/\/terms<\/loc>[\s\S]*?<lastmod>2026-09-16/);
});

const PLATFORM_PAGES = [
  { slug: "instagram-video-downloader", heading: /Instagram/, breadcrumb: /Instagram/ },
  { slug: "twitter-video-downloader", heading: /Twitter \(X\)/, breadcrumb: /Twitter/ },
  { slug: "threads-video-downloader", heading: /Threads/, breadcrumb: /Threads/ },
];

for (const { slug, heading, breadcrumb } of PLATFORM_PAGES) {
  test(`/${slug} is a download page for its Platform in both locales`, async ({
    page,
  }) => {
    for (const [prefix, download] of [
      ["", /^Download /],
      ["/uk", /^Завантажити /],
    ] as const) {
      const path = `${prefix}/${slug}`;
      await page.goto(path);

      await expect(page, path).toHaveTitle(download);
      await expect(page, path).toHaveTitle(heading);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1, path).toHaveText(download);
      await expect(h1, path).toHaveText(heading);
      await expect(page.locator('head meta[name="description"]'), path).toHaveAttribute(
        "content",
        /.{50,}/,
      );

      const canonical = page.locator('head link[rel="canonical"]');
      expect(pathOf(await canonical.getAttribute("href")), path).toBe(path);
      expect(await hreflangPaths(page), path).toEqual({
        en: `/${slug}`,
        uk: `/uk/${slug}`,
        "x-default": `/${slug}`,
      });

      const jsonLd = JSON.parse(
        (await page.locator('script[type="application/ld+json"]').textContent())!,
      );
      const trail = jsonLd["@graph"].find(
        (node: { "@type": string }) => node["@type"] === "BreadcrumbList",
      ).itemListElement;
      expect(trail.map((item: { item: string }) => pathOf(item.item)), path).toEqual([
        prefix || "/",
        path,
      ]);
      expect(trail[1].name, path).toMatch(breadcrumb);

      // The page is the tool, not a signpost to the home page.
      await expect(page.getByRole("textbox"), path).toBeVisible();
    }
  });
}

test("the landing pages don't share a title or heading", async ({ page }) => {
  const titles = new Set<string>();
  const headings = new Set<string>();
  for (const { slug } of PLATFORM_PAGES) {
    await page.goto(`/${slug}`);
    titles.add(await page.title());
    headings.add(await page.getByRole("heading", { level: 1 }).innerText());
  }
  expect(titles.size).toBe(PLATFORM_PAGES.length);
  expect(headings.size).toBe(PLATFORM_PAGES.length);
});

// English only: under `next dev` a client-side navigation re-renders the
// page without the locale layout, so server components fall back to English
// (the production build serves the prerendered Ukrainian page).
test("the home page links to every Platform's landing page, which link to each other", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Download by platform" });
  await expect(nav.getByRole("link")).toHaveCount(3);

  await nav.getByRole("link", { name: /Threads/ }).click();
  await expect(page).toHaveURL(/\/threads-video-downloader$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Threads/);

  const others = page.getByRole("navigation", { name: "Download by platform" });
  await expect(others.getByRole("link")).toHaveCount(2);
  await expect(others.getByRole("link", { name: /Threads/ })).toHaveCount(0);

  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Home" })
    .click();
  await expect(page).toHaveURL(/^[^?]+:\d+\/$/);
});

test("an unknown page 404s rather than rendering a landing page", async ({
  request,
}) => {
  for (const path of ["/tiktok-video-downloader", "/uk/tiktok-video-downloader"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("the home page says download as well as share", async ({ page }) => {
  for (const [path, download] of [
    ["/", /Download/],
    ["/uk", /авантаж/],
  ] as const) {
    await page.goto(path);
    await expect(page, path).toHaveTitle(download);
    await expect(page.getByRole("heading", { level: 1 }), path).toHaveText(download);
  }
});

test("a page canonicalizes to itself without the query and lists its translations", async ({
  page,
}) => {
  await page.goto("/uk/terms?url=https://x.com/someone/status/2");

  const canonical = page.locator('head link[rel="canonical"]');
  expect(pathOf(await canonical.getAttribute("href"))).toBe("/uk/terms");
  expect(await hreflangPaths(page)).toEqual({
    en: "/terms",
    uk: "/uk/terms",
    "x-default": "/terms",
  });
});

test("link previews get a title and a locale's share image", async ({
  page,
  request,
}) => {
  await page.goto("/uk");

  await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute(
    "content",
    /ClipBeam/,
  );
  const image = await page
    .locator('head meta[property="og:image"]')
    .getAttribute("content");
  expect(pathOf(image)).toBe("/uk/og.png");
  await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );

  const response = await request.get("/uk/og.png");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
});

test("the home page names all three supported Platforms in both locales", async ({
  page,
}) => {
  const PLATFORMS = /Instagram, X.*Threads/;
  for (const path of ["/", "/uk"]) {
    await page.goto(path);
    await expect(page, path).toHaveTitle(PLATFORMS);
    await expect(page.locator('head meta[name="description"]'), path).toHaveAttribute(
      "content",
      /Instagram, X \(Twitter\).*Threads/,
    );
    await expect(page.getByRole("heading", { level: 1 }), path).toHaveText(
      /Instagram, X \(Twitter\).*Threads/,
    );
  }
});

test("the home page answers common questions, mirrored in structured data", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Frequently asked questions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Do I need an account?" }),
  ).toBeVisible();

  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  const faqPage = jsonLd["@graph"].find(
    (node: { "@type": string }) => node["@type"] === "FAQPage",
  );
  expect(faqPage.mainEntity).toContainEqual(
    expect.objectContaining({ name: "Do I need an account?" }),
  );
});

test("the FAQ is translated", async ({ page }) => {
  await page.goto("/uk");

  await expect(page.getByRole("heading", { name: "Поширені запитання" })).toBeVisible();
});

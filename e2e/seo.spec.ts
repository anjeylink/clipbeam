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
  for (const path of ["/uk", "/terms", "/uk/terms", "/privacy", "/uk/dmca"]) {
    expect(body).toMatch(new RegExp(`<loc>[^<]+${path}</loc>`));
  }
  expect(body).toContain('hreflang="x-default"');
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

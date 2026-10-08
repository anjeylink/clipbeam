import { test, expect } from "@playwright/test";

const LOCALES = [
  { prefix: "", lang: "en", heading: "Page not found", home: "Back to the home page" },
  {
    prefix: "/uk",
    lang: "uk",
    heading: "Сторінку не знайдено",
    home: "На головну сторінку",
  },
];

for (const { prefix, lang, heading, home } of LOCALES) {
  for (const unknown of ["/nope", "/nope/deeper", "/terms/extra"]) {
    const path = `${prefix}${unknown}`;

    test(`${path} is the site's own 404 page in its locale`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response!.status()).toBe(404);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page).toHaveTitle(new RegExp(heading));
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );

      // The same chrome as every other page.
      await expect(
        page.getByRole("banner").getByRole("link", { name: "ClipBeam" }),
      ).toBeVisible();
      await expect(
        page.getByRole("contentinfo").getByRole("link", { name: "DMCA" }),
      ).toBeVisible();

      await expect(
        page.getByRole("link", { name: "support@clipbeam.app" }),
      ).toHaveAttribute("href", "mailto:support@clipbeam.app");

      await page.getByRole("link", { name: home }).click();
      await expect(page).toHaveURL(new RegExp(`${prefix || "/"}$`));
      await expect(page.getByRole("textbox")).toBeVisible();
    });
  }
}

test("a path whose first segment isn't a locale gets the 404 page, not that segment as its language", async ({
  page,
}) => {
  // Dotted paths skip the proxy, so their first segment reaches [locale] as is.
  // With no locale in the URL, the page falls back to the browser's (English).
  for (const path of ["/llms.txt", "/foo.txt/bar", "/de/og.png"]) {
    const response = await page.goto(path);
    expect(response!.status(), path).toBe(404);
    await expect(page.getByRole("heading", { level: 1 }), path).toHaveText(
      "Page not found",
    );
    await expect(page.locator("html"), path).toHaveAttribute("lang", "en");
    await expect(page.getByRole("contentinfo"), path).toBeVisible();
  }
});

test("the 404 page is in the server's HTML, not rendered by the client", async ({
  request,
}) => {
  const response = await request.get("/uk/nope/deeper");
  expect(response.status()).toBe(404);
  const body = await response.text();
  expect(body).toMatch(/<html[^>]* lang="uk"/);
  expect(body).toMatch(/<h1[^>]*>Сторінку не знайдено<\/h1>/);
  expect(body).toContain("<footer");
});

test("the 404 page doesn't change the locale other pages render in", async ({
  request,
}) => {
  // The 404 page mounts a second Intlayer provider, and its locale is
  // request-wide on the server: one in a page's own tree would overwrite it.
  const body = await (await request.get("/uk/terms")).text();
  expect(body).toMatch(/<h1[^>]*>Умови використання<\/h1>/);
});

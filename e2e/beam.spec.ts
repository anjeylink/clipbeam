import { test, expect, type BrowserContext } from "@playwright/test";
import { BEAM_SESSION_COOKIE, beamSessionToken } from "../src/lib/server/beam/beam-auth";

// Must match webServer.env in playwright.config.ts.
const BEAM_SECRET = "e2e-beam-secret";

// Pairing is checked server-side while rendering /beam, out of page.route()'s
// reach, so paired tests carry a real cookie signed with the test secret.
async function pair(context: BrowserContext) {
  await context.addCookies([
    {
      name: BEAM_SESSION_COOKIE,
      value: beamSessionToken(BEAM_SECRET),
      url: "http://localhost:3000",
    },
  ]);
}

const POST_LINK_LABEL = /post link/i;

test("an unpaired visitor sees only the key form, and a wrong key is rejected", async ({
  page,
}) => {
  await page.goto("/beam");

  await expect(page.getByRole("heading", { name: "Beam", level: 1 })).toBeVisible();
  await expect(page.getByLabel(POST_LINK_LABEL)).toHaveCount(0);

  await page.getByLabel(/beam key/i).fill("not-the-key");
  await page.getByRole("button", { name: /pair device/i }).click();
  await expect(page.getByText(/that key isn't right/i)).toBeVisible();
  await expect(page.getByLabel(POST_LINK_LABEL)).toHaveCount(0);
});

test("the right key pairs the device and unlocks the send form", async ({ page, context }) => {
  await page.goto("/beam");
  await page.getByLabel(/beam key/i).fill(BEAM_SECRET);
  await page.getByRole("button", { name: /pair device/i }).click();

  await expect(page.getByLabel(POST_LINK_LABEL)).toBeVisible();
  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name === BEAM_SESSION_COOKIE);
  expect(session?.httpOnly).toBe(true);
  // The cookie proves pairing without carrying the key itself.
  expect(session?.value).not.toContain(BEAM_SECRET);
});

test("sends a pasted post link to the phone", async ({ page, context }) => {
  await pair(context);
  let sentBody: unknown;
  await page.route("**/api/beam/send", async (route) => {
    sentBody = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true, delivered: 1 } });
  });

  await page.goto("/beam");
  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
  await page.getByRole("button", { name: /send to phone/i }).click();

  await expect(page.getByText(/sent\. tap the notification/i)).toBeVisible();
  expect(sentBody).toEqual({ url: "https://x.com/someone/status/2" });
  await expect(page.getByLabel(POST_LINK_LABEL)).toHaveValue("");
});

test("says so when no phone is set up to receive", async ({ page, context }) => {
  await pair(context);
  await page.route("**/api/beam/send", (route) =>
    route.fulfill({ status: 409, json: { code: "no-device" } }),
  );

  await page.goto("/beam");
  await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
  await page.getByRole("button", { name: /send to phone/i }).click();

  await expect(page.getByText(/no phone is set up yet/i)).toBeVisible();
});

test("rejects a non-post link without calling the server", async ({ page, context }) => {
  await pair(context);
  let sendCalls = 0;
  await page.route("**/api/beam/send", (route) => {
    sendCalls++;
    return route.fulfill({ json: { ok: true, delivered: 1 } });
  });

  await page.goto("/beam");
  await page.getByLabel(POST_LINK_LABEL).fill("https://example.com/not-a-post");
  await page.getByRole("button", { name: /send to phone/i }).click();

  await expect(page.getByText(/doesn't look like an Instagram, X/i)).toBeVisible();
  expect(sendCalls).toBe(0);
});

test("the send API refuses an unpaired caller", async ({ request }) => {
  const response = await request.post("/api/beam/send", {
    data: { url: "https://x.com/someone/status/2" },
  });
  expect(response.status()).toBe(401);
});

test("the Beam page is kept out of search results in every locale", async ({ page }) => {
  for (const path of ["/beam", "/uk/beam"]) {
    await page.goto(path);
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  }
});

test("the footer Beam link only shows in the installed Home Screen app", async ({ page }) => {
  await page.goto("/");
  const legalNav = page.getByRole("navigation", { name: /legal/i });
  await expect(legalNav.getByRole("link", { name: /terms/i })).toBeVisible();
  await expect(legalNav.getByRole("link", { name: "Beam" })).toHaveCount(0);

  // Chromium can't emulate display-mode, so fake the standalone query.
  await page.addInitScript(() => {
    const realMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      const list = realMatchMedia(query);
      if (query === "(display-mode: standalone)") {
        Object.defineProperty(list, "matches", { value: true });
      }
      return list;
    };
  });
  await page.reload();
  await expect(legalNav.getByRole("link", { name: "Beam" })).toHaveAttribute("href", "/beam");
});

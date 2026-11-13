import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { BEAM_COOKIES, signBeamCookie } from "../src/lib/server/beam/beam-auth";

// Must match webServer.env in playwright.config.ts.
const BEAM_SECRET = "e2e-beam-secret";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

// Whether this computer is connected is read server-side while rendering
// /beam, out of page.route()'s reach, so connected tests carry a real
// cookie signed with the test secret.
async function connectComputer(context: BrowserContext) {
  await context.addCookies([
    {
      name: BEAM_COOKIES.computer,
      value: signBeamCookie("computer", "e2e-phone", BEAM_SECRET),
      url: "http://localhost:3000",
      httpOnly: true,
    },
  ]);
}

// Chromium can't reach a real push service in tests, so stand in for a
// phone that already subscribed.
async function stubExistingSubscription(page: Page) {
  await page.addInitScript(() => {
    PushManager.prototype.getSubscription = async () =>
      ({
        toJSON: () => ({
          endpoint: "https://push.example/e2e",
          keys: { p256dh: "key", auth: "auth" },
        }),
      }) as unknown as PushSubscription;
  });
}

const POST_LINK_LABEL = /post link/i;
const CODE_LABEL = /code from your phone/i;

test.describe("on a computer", () => {
  test("an unconnected computer asks for the phone's code and explains where to get it", async ({
    page,
  }) => {
    await page.goto("/beam");

    await expect(page.getByRole("heading", { name: "Beam", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /connect your phone/i })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "localhost:3000/beam" })).toBeVisible();
    await expect(page.getByLabel(CODE_LABEL)).toBeVisible();
    await expect(page.getByLabel(POST_LINK_LABEL)).toHaveCount(0);
  });

  test("the code from the phone connects the computer and unlocks the send form", async ({
    page,
    context,
  }) => {
    let sentBody: unknown;
    await page.route("**/api/beam/connect", async (route) => {
      sentBody = route.request().postDataJSON();
      await connectComputer(context);
      await route.fulfill({ json: { ok: true } });
    });

    await page.goto("/beam");
    await page.getByLabel(CODE_LABEL).fill("012 345");
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByLabel(POST_LINK_LABEL)).toBeVisible();
    await expect(page.getByLabel(CODE_LABEL)).toHaveCount(0);
    expect(sentBody).toEqual({ code: "012345" });
  });

  test("a wrong or expired code is rejected", async ({ page }) => {
    await page.route("**/api/beam/connect", (route) =>
      route.fulfill({ status: 400, json: { code: "invalid-code" } }),
    );

    await page.goto("/beam");
    await page.getByLabel(CODE_LABEL).fill("999999");
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText(/that code isn't right or has expired/i)).toBeVisible();
    await expect(page.getByLabel(POST_LINK_LABEL)).toHaveCount(0);
  });

  test("a code that isn't six digits never reaches the server", async ({ page }) => {
    let connectCalls = 0;
    await page.route("**/api/beam/connect", (route) => {
      connectCalls++;
      return route.fulfill({ json: { ok: true } });
    });

    await page.goto("/beam");
    await page.getByLabel(CODE_LABEL).fill("12");
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText(/that code isn't right/i)).toBeVisible();
    expect(connectCalls).toBe(0);
  });

  test("too many tries are explained", async ({ page }) => {
    await page.route("**/api/beam/connect", (route) =>
      route.fulfill({ status: 429, json: { code: "too-many-attempts" } }),
    );

    await page.goto("/beam");
    await page.getByLabel(CODE_LABEL).fill("123456");
    await page.getByRole("button", { name: "Connect" }).click();

    await expect(page.getByText(/too many tries/i)).toBeVisible();
  });

  test("sends a pasted post link to the phone", async ({ page, context }) => {
    await connectComputer(context);
    let sentBody: unknown;
    await page.route("**/api/beam/send", async (route) => {
      sentBody = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });

    await page.goto("/beam");
    await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
    await page.getByRole("button", { name: /send to phone/i }).click();

    await expect(page.getByText(/sent\. tap the notification/i)).toBeVisible();
    expect(sentBody).toEqual({ url: "https://x.com/someone/status/2" });
    await expect(page.getByLabel(POST_LINK_LABEL)).toHaveValue("");
  });

  test("rejects a non-post link without calling the server", async ({ page, context }) => {
    await connectComputer(context);
    let sendCalls = 0;
    await page.route("**/api/beam/send", (route) => {
      sendCalls++;
      return route.fulfill({ json: { ok: true } });
    });

    await page.goto("/beam");
    await page.getByLabel(POST_LINK_LABEL).fill("https://example.com/not-a-post");
    await page.getByRole("button", { name: /send to phone/i }).click();

    await expect(page.getByText(/doesn't look like an Instagram, X/i)).toBeVisible();
    expect(sendCalls).toBe(0);
  });

  test("when the phone stops receiving, the computer goes back to asking for a code", async ({
    page,
    context,
  }) => {
    await connectComputer(context);
    // The real route clears the cookie alongside the 409.
    await page.route("**/api/beam/send", async (route) => {
      await context.clearCookies({ name: BEAM_COOKIES.computer });
      await route.fulfill({ status: 409, json: { code: "no-device" } });
    });

    await page.goto("/beam");
    await page.getByLabel(POST_LINK_LABEL).fill("https://x.com/someone/status/2");
    await page.getByRole("button", { name: /send to phone/i }).click();

    await expect(page.getByText(/your phone stopped receiving links/i)).toBeVisible();
    await expect(page.getByLabel(CODE_LABEL)).toBeVisible();
    await expect(page.getByLabel(POST_LINK_LABEL)).toHaveCount(0);

    // Reconnecting and later disconnecting must not repeat the old notice.
    await page.route("**/api/beam/connect", async (route) => {
      await connectComputer(context);
      await route.fulfill({ json: { ok: true } });
    });
    await page.getByLabel(CODE_LABEL).fill("123456");
    await page.getByRole("button", { name: "Connect" }).click();
    await page.getByRole("button", { name: /disconnect phone/i }).click();
    await expect(page.getByLabel(CODE_LABEL)).toBeVisible();
    await expect(page.getByText(/your phone stopped receiving links/i)).toHaveCount(0);
  });

  test("Disconnect forgets the phone on this computer", async ({ page, context }) => {
    await connectComputer(context);
    await page.goto("/beam");

    await page.getByRole("button", { name: /disconnect phone/i }).click();

    await expect(page.getByLabel(CODE_LABEL)).toBeVisible();
    await expect(page.getByLabel(POST_LINK_LABEL)).toHaveCount(0);
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === BEAM_COOKIES.computer)).toBeUndefined();
  });

  test("a computer can switch to the phone setup when the guess is wrong", async ({ page }) => {
    await page.goto("/beam");
    await page.getByRole("link", { name: /using a phone/i }).click();

    await expect(page.getByRole("heading", { name: /get links on this phone/i })).toBeVisible();
    await expect(page.getByLabel(CODE_LABEL)).toHaveCount(0);
  });
});

test.describe("on an iPhone in Safari", () => {
  test.use({ userAgent: IPHONE_UA });

  test("walks through adding ClipBeam to the Home Screen", async ({ page }) => {
    await page.goto("/beam");

    await expect(page.getByRole("heading", { name: /get links on this phone/i })).toBeVisible();
    const steps = page.getByRole("listitem");
    await expect(steps.filter({ hasText: /share button/i })).toBeVisible();
    await expect(steps.filter({ hasText: /add to home screen/i })).toBeVisible();
    await expect(steps.filter({ hasText: /open clipbeam from your home screen/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /turn on notifications/i })).toHaveCount(0);
  });
});

test.describe("on an Android phone", () => {
  test.use({ userAgent: ANDROID_UA });

  // Headless Chromium reports notifications as blocked, even when granted.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Notification, "permission", { get: () => "default" });
    });
  });

  test("offers to turn on notifications", async ({ page }) => {
    await page.goto("/beam");

    await expect(page.getByRole("heading", { name: /get links on this phone/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /turn on notifications/i })).toBeVisible();
  });

  test("a subscribed phone shows a code for the computer, and a new one on request", async ({
    page,
  }) => {
    await stubExistingSubscription(page);
    let subscribed: unknown;
    await page.route("**/api/beam/subscribe", async (route) => {
      subscribed = route.request().postDataJSON();
      await route.fulfill({ json: { ok: true } });
    });
    // Dev's Strict Mode may fetch the first code twice, so every request
    // gets its own code rather than a fixed sequence.
    let issued = 0;
    await page.route("**/api/beam/code", (route) =>
      route.fulfill({ json: { code: String(100000 + issued++), expiresInSeconds: 600 } }),
    );

    await page.goto("/beam");

    const code = page.getByLabel(/connection code/i);
    await expect(code).toHaveText(/^\d{3} \d{3}$/);
    await expect(page.getByText("localhost:3000/beam")).toBeVisible();
    expect(subscribed).toMatchObject({
      subscription: { endpoint: "https://push.example/e2e" },
      locale: "en",
    });

    const latest = String(100000 + issued);
    await page.getByRole("button", { name: /new code/i }).click();
    await expect(code).toHaveText(`${latest.slice(0, 3)} ${latest.slice(3)}`);
  });

  test("an expired code is replaced on request", async ({ page }) => {
    await page.clock.install();
    await stubExistingSubscription(page);
    await page.route("**/api/beam/subscribe", (route) => route.fulfill({ json: { ok: true } }));
    await page.route("**/api/beam/code", (route) =>
      route.fulfill({ json: { code: "012345", expiresInSeconds: 600 } }),
    );

    await page.goto("/beam");
    await expect(page.getByLabel(/connection code/i)).toHaveText("012 345");

    await page.clock.fastForward("10:01");
    await expect(page.getByText(/this code has expired/i)).toBeVisible();
    await expect(page.getByLabel(/connection code/i)).toHaveCount(0);
  });
});

test.describe("the Beam API", () => {
  test("refuses to send for a computer that isn't connected", async ({ request }) => {
    const response = await request.post("/api/beam/send", {
      data: { url: "https://x.com/someone/status/2" },
    });
    expect(response.status()).toBe(401);
  });

  test("refuses a code to a phone that never subscribed", async ({ request }) => {
    expect((await request.post("/api/beam/code")).status()).toBe(401);
  });

  test("rejects a malformed code before looking it up", async ({ request }) => {
    for (const code of ["12", "abcdef", 123456]) {
      const response = await request.post("/api/beam/connect", { data: { code } });
      expect(response.status(), String(code)).toBe(400);
    }
  });

  test("refuses a computer cookie signed for another role", async ({ request }) => {
    const response = await request.post("/api/beam/send", {
      headers: {
        cookie: `${BEAM_COOKIES.computer}=${signBeamCookie("phone", "e2e-phone", BEAM_SECRET)}`,
      },
      data: { url: "https://x.com/someone/status/2" },
    });
    expect(response.status()).toBe(401);
  });
});

test("the home page promotes Beam and leads to it", async ({ page }) => {
  for (const [path, href] of [
    ["/", "/beam"],
    ["/uk", "/uk/beam"],
  ] as const) {
    await page.goto(path);
    await expect(
      page.getByRole("region", { name: /found it on your computer|знайшли на комп/i }),
      path,
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /set up beam|налаштувати beam/i }),
      path,
    ).toHaveAttribute("href", href);
  }

  await page.getByRole("link", { name: /налаштувати beam/i }).click();
  await expect(page.getByRole("heading", { name: "Beam", level: 1 })).toBeVisible();
});

test("every page links to Beam in the footer", async ({ page }) => {
  for (const [path, href] of [
    ["/", "/beam"],
    ["/uk/terms", "/uk/beam"],
  ] as const) {
    await page.goto(path);
    const legalNav = page.getByRole("navigation", { name: /legal|правова/i });
    await expect(legalNav.getByRole("link", { name: "Beam" }), path).toHaveAttribute(
      "href",
      href,
    );
  }
});

test("the Beam page is indexable and canonical in every locale", async ({ page }) => {
  for (const path of ["/beam", "/uk/beam"]) {
    await page.goto(path);
    await expect(page.locator('head meta[name="robots"]'), path).toHaveCount(0);
    const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical!).pathname, path).toBe(path);
  }
});

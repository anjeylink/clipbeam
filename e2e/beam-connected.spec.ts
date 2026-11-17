import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { BEAM_CONNECTED_COOKIE } from "../src/lib/beam";
import { BEAM_COOKIES, signBeamCookie } from "../src/lib/server/beam/beam-auth";

// Must match webServer.env in playwright.config.ts.
const BEAM_SECRET = "e2e-beam-secret";

const IMAGE_FIXTURE = {
  platform: "x",
  postUrl: "https://x.com/someone/status/2",
  authorHandle: "someone",
  items: [
    {
      kind: "image",
      previewUrl: "/mock/sample-image.jpg",
      proxiedUrl: `/api/download?${new URLSearchParams({ url: "/mock/sample-image.jpg" })}`,
    },
  ],
};

// Differs from IMAGE_FIXTURE.postUrl, so a send of what was typed shows up.
const TYPED_URL = "https://x.com/someone/status/2?s=20";

const SEND_BUTTON = { name: /send to phone/i };
const PITCH_PROMO = { name: /found it on your computer/i };
const CONNECTED_PROMO = { name: /your phone is connected/i };

async function addConnectedHint(context: BrowserContext) {
  await context.addCookies([
    { name: BEAM_CONNECTED_COOKIE, value: "1", url: "http://localhost:3000", httpOnly: false },
  ]);
}

// What /api/beam/connect leaves behind: the signed cookie and its hint.
async function connectComputer(context: BrowserContext) {
  await context.addCookies([
    {
      name: BEAM_COOKIES.computer,
      value: signBeamCookie("computer", "e2e-phone", BEAM_SECRET),
      url: "http://localhost:3000",
      httpOnly: true,
    },
  ]);
  await addConnectedHint(context);
}

async function hasCookie(context: BrowserContext, name: string) {
  return (await context.cookies()).some((cookie) => cookie.name === name);
}

// Waits for Download, so an absent Send to phone button means it was never
// offered rather than not rendered yet.
async function loadPost(page: Page) {
  await page.route("**/api/resolve*", (route) => route.fulfill({ json: IMAGE_FIXTURE }));
  await page.getByLabel(/post link/i).fill(TYPED_URL);
  await page.getByRole("button", { name: /get media/i }).click();
  await expect(page.getByRole("link", { name: /^download$/i })).toBeVisible({ timeout: 5000 });
}

test("an unconnected computer gets no Send to phone button and the Beam pitch", async ({
  page,
}) => {
  await page.goto("/");
  await loadPost(page);

  await expect(page.getByRole("button", SEND_BUTTON)).toHaveCount(0);
  await expect(page.getByRole("region", PITCH_PROMO)).toBeVisible();
  await expect(page.getByRole("region", CONNECTED_PROMO)).toHaveCount(0);
});

test("a connected computer sends the loaded post to its phone from the home page", async ({
  page,
  context,
}) => {
  await connectComputer(context);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  let sentBody: unknown;
  let releaseSend!: () => void;
  const sendGate = new Promise<void>((resolve) => (releaseSend = resolve));
  await page.route("**/api/beam/send", async (route) => {
    sentBody = route.request().postDataJSON();
    await sendGate;
    await route.fulfill({ json: { ok: true } });
  });

  await page.goto("/");
  await expect(page.getByRole("region", CONNECTED_PROMO)).toBeVisible();
  await expect(page.getByRole("link", { name: /manage beam/i })).toHaveAttribute("href", "/beam");

  await loadPost(page);
  const sendButton = page.getByRole("button", SEND_BUTTON);
  await sendButton.click();
  await expect(sendButton).toBeDisabled();
  releaseSend();

  await expect(page.getByRole("status").filter({ hasText: /sent to your phone/i })).toBeVisible();
  await expect(sendButton).toBeEnabled();
  expect(sentBody).toEqual({ url: IMAGE_FIXTURE.postUrl });
  // The prerendered promo is the pitch; reading the cookie while hydrating
  // would mismatch it.
  expect(errors.filter((text) => /hydrat/i.test(text))).toEqual([]);
});

test("when the phone stops receiving, the button gives way to a link back to Beam", async ({
  page,
  context,
}) => {
  await connectComputer(context);
  // The real route clears both cookies alongside the 409.
  await page.route("**/api/beam/send", async (route) => {
    await context.clearCookies({ name: BEAM_COOKIES.computer });
    await context.clearCookies({ name: BEAM_CONNECTED_COOKIE });
    await route.fulfill({ status: 409, json: { code: "no-device" } });
  });

  await page.goto("/");
  await loadPost(page);
  await page.getByRole("button", SEND_BUTTON).click();

  const alert = page.getByRole("alert").filter({ hasText: /no longer connected/i });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("link", { name: /connect it again/i })).toHaveAttribute(
    "href",
    "/beam",
  );
  await expect(page.getByRole("button", SEND_BUTTON)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /^download$/i })).toBeVisible();
  await expect(page.getByRole("region", PITCH_PROMO)).toBeVisible();
});

test("a hint the server can't back is cleared on the first send", async ({ page, context }) => {
  await addConnectedHint(context);

  await page.goto("/");
  await loadPost(page);
  await page.getByRole("button", SEND_BUTTON).click();

  await expect(page.getByRole("alert").filter({ hasText: /no longer connected/i })).toBeVisible();
  await expect(page.getByRole("button", SEND_BUTTON)).toHaveCount(0);
  await expect(page.getByRole("region", PITCH_PROMO)).toBeVisible();
  expect(await hasCookie(context, BEAM_CONNECTED_COOKIE)).toBe(false);
});

test("disconnecting on /beam takes Beam off the home page", async ({ page, context }) => {
  await connectComputer(context);

  // Starts on the home page, so the connected state is read before
  // disconnecting and every later page arrives by client-side navigation.
  await page.goto("/");
  await expect(page.getByRole("region", CONNECTED_PROMO)).toBeVisible();
  await page.getByRole("link", { name: /manage beam/i }).click();
  await page.getByRole("button", { name: /disconnect phone/i }).click();
  await expect(page.getByLabel(/code from your phone/i)).toBeVisible();
  expect(await hasCookie(context, BEAM_CONNECTED_COOKIE)).toBe(false);

  await page.getByRole("banner").getByRole("link", { name: "ClipBeam" }).click();
  await expect(page.getByRole("region", PITCH_PROMO)).toBeVisible();
  await loadPost(page);
  await expect(page.getByRole("button", SEND_BUTTON)).toHaveCount(0);
});

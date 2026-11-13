import { NextResponse } from "next/server";
import { defaultLocale, isDeclaredLocale, type Locale } from "intlayer";
import type { PushSubscription } from "web-push";
import { newPhoneId } from "@/lib/server/beam/beam-auth";
import { beamPhoneId, clientIp, setBeamCookie } from "@/lib/server/beam/beam-session";
import { allowAttempt, savePhone } from "@/lib/server/beam/beam-store";

function isPushSubscription(value: unknown): value is PushSubscription {
  const sub = value as PushSubscription | null;
  return (
    typeof sub?.endpoint === "string" &&
    sub.endpoint.startsWith("https://") &&
    typeof sub.keys?.p256dh === "string" &&
    typeof sub.keys?.auth === "string"
  );
}

// Registers this phone as a Beam receiver, or refreshes its subscription.
// Open to anyone: a phone only ever receives from computers that typed one
// of its codes.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    subscription?: unknown;
    locale?: unknown;
  } | null;

  if (!isPushSubscription(body?.subscription)) {
    return NextResponse.json({ code: "invalid-subscription" }, { status: 400 });
  }
  const locale: Locale =
    typeof body.locale === "string" && isDeclaredLocale(body.locale)
      ? (body.locale as Locale)
      : defaultLocale;

  let phoneId = await beamPhoneId("phone");
  if (!phoneId) {
    if (!(await allowAttempt(`new-phone:${clientIp(request)}`, 20, 60 * 60))) {
      return NextResponse.json({ code: "too-many-attempts" }, { status: 429 });
    }
    phoneId = newPhoneId();
  }

  const { endpoint, keys } = body.subscription;
  await savePhone(phoneId, { subscription: { endpoint, keys }, locale });

  const response = NextResponse.json({ ok: true });
  setBeamCookie(response, "phone", phoneId);
  return response;
}

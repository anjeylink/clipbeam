import { NextResponse } from "next/server";
import { defaultLocale, isDeclaredLocale, type Locale } from "intlayer";
import type { PushSubscription } from "web-push";
import { isBeamPaired } from "@/lib/server/beam/beam-session";
import { saveSubscription } from "@/lib/server/beam/beam-store";

function isPushSubscription(value: unknown): value is PushSubscription {
  const sub = value as PushSubscription | null;
  return (
    typeof sub?.endpoint === "string" &&
    sub.endpoint.startsWith("https://") &&
    typeof sub.keys?.p256dh === "string" &&
    typeof sub.keys?.auth === "string"
  );
}

export async function POST(request: Request) {
  if (!(await isBeamPaired())) {
    return NextResponse.json({ code: "not-paired" }, { status: 401 });
  }

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

  const { endpoint, keys } = body.subscription;
  await saveSubscription({ endpoint, keys }, locale);
  return NextResponse.json({ ok: true });
}

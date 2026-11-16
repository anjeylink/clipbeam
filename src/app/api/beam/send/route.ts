import { NextResponse } from "next/server";
import { validatePostUrl } from "@/lib/parse-post-url";
import { beamPhoneId, clearBeamCookie } from "@/lib/server/beam/beam-session";
import { allowAttempt } from "@/lib/server/beam/beam-store";
import { sendBeam } from "@/lib/server/beam/send-beam";

export async function POST(request: Request) {
  const phoneId = await beamPhoneId("computer");
  if (!phoneId) {
    return NextResponse.json({ code: "not-connected" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  // Format only: the phone resolves the media itself when it opens the
  // link, through the same /api/resolve flow as a pasted URL.
  if (!validatePostUrl(url).valid) {
    return NextResponse.json({ code: "invalid-format" }, { status: 422 });
  }

  if (!(await allowAttempt(`send:${phoneId}`, 30, 60))) {
    return NextResponse.json({ code: "too-many-attempts" }, { status: 429 });
  }

  if ((await sendBeam(phoneId, { kind: "post", postUrl: url })) === "no-phone") {
    // The phone is gone for good, so this computer goes back to asking for
    // a code.
    const response = NextResponse.json({ code: "no-device" }, { status: 409 });
    clearBeamCookie(response, "computer");
    return response;
  }
  return NextResponse.json({ ok: true });
}

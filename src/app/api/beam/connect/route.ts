import { NextResponse } from "next/server";
import { BEAM_CODE_TTL_SECONDS, isBeamCode, normalizeBeamCode } from "@/lib/beam";
import { clientIp, setBeamCookie } from "@/lib/server/beam/beam-session";
import { allowAttempt, consumeCode } from "@/lib/server/beam/beam-store";
import { sendBeam } from "@/lib/server/beam/send-beam";

// Connects this computer to the phone showing the code.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? normalizeBeamCode(body.code) : "";
  if (!isBeamCode(code)) {
    return NextResponse.json({ code: "invalid-code" }, { status: 400 });
  }

  // Checked before the code is consumed: six digits only stay safe while
  // guessing them is slow.
  if (!(await allowAttempt(`connect:${clientIp(request)}`, 10, BEAM_CODE_TTL_SECONDS))) {
    return NextResponse.json({ code: "too-many-attempts" }, { status: 429 });
  }

  const phoneId = await consumeCode(code);
  if (!phoneId) {
    return NextResponse.json({ code: "invalid-code" }, { status: 400 });
  }

  if ((await sendBeam(phoneId, { kind: "connected" })) === "no-phone") {
    return NextResponse.json({ code: "no-device" }, { status: 409 });
  }

  const response = NextResponse.json({ ok: true });
  setBeamCookie(response, "computer", phoneId);
  return response;
}

import { NextResponse } from "next/server";
import {
  BEAM_SESSION_COOKIE,
  BEAM_SESSION_MAX_AGE_SECONDS,
  beamSessionToken,
  isValidBeamKey,
} from "@/lib/server/beam/beam-auth";

export async function POST(request: Request) {
  const secret = process.env.BEAM_SECRET;
  const body = (await request.json().catch(() => null)) as { key?: unknown } | null;
  const key = typeof body?.key === "string" ? body.key : "";

  if (!secret || !isValidBeamKey(key, secret)) {
    return NextResponse.json({ code: "invalid-key" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(BEAM_SESSION_COOKIE, beamSessionToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: BEAM_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

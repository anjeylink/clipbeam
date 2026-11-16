import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  BEAM_COOKIES,
  BEAM_COOKIE_MAX_AGE_SECONDS,
  readBeamCookie,
  signBeamCookie,
  type BeamRole,
} from "./beam-auth";

/** The phone id this request's cookie for `role` carries, if it's ours. */
export async function beamPhoneId(role: BeamRole): Promise<string | null> {
  const cookieStore = await cookies();
  return readBeamCookie(role, cookieStore.get(BEAM_COOKIES[role])?.value, process.env.BEAM_SECRET);
}

export function setBeamCookie(response: NextResponse, role: BeamRole, phoneId: string) {
  const secret = process.env.BEAM_SECRET;
  if (!secret) throw new Error("Beam is not configured: missing BEAM_SECRET");
  response.cookies.set(BEAM_COOKIES[role], signBeamCookie(role, phoneId, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: BEAM_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearBeamCookie(response: NextResponse, role: BeamRole) {
  // The path must match the one it was set with, or the browser keeps it.
  response.cookies.set(BEAM_COOKIES[role], "", { path: "/", maxAge: 0 });
}

/** The caller's IP for rate limiting; Vercel puts the client first. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

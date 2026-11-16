import { NextResponse } from "next/server";
import { clearBeamCookie } from "@/lib/server/beam/beam-session";

// The computer forgets its phone; the phone itself is untouched and stays
// connected to any other computer.
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearBeamCookie(response, "computer");
  return response;
}

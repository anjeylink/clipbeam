import { NextResponse } from "next/server";
import { validatePostUrl } from "@/lib/parse-post-url";
import { isBeamPaired } from "@/lib/server/beam/beam-session";
import { sendBeam } from "@/lib/server/beam/send-beam";

export async function POST(request: Request) {
  if (!(await isBeamPaired())) {
    return NextResponse.json({ code: "not-paired" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  // Format only: the phone resolves the media itself when it opens the
  // link, through the same /api/resolve flow as a pasted URL.
  if (!validatePostUrl(url).valid) {
    return NextResponse.json({ code: "invalid-format" }, { status: 422 });
  }

  const delivered = await sendBeam(url);
  if (delivered === 0) {
    return NextResponse.json({ code: "no-device" }, { status: 409 });
  }
  return NextResponse.json({ ok: true, delivered });
}

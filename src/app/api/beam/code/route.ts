import { NextResponse } from "next/server";
import { BEAM_CODE_TTL_SECONDS } from "@/lib/beam";
import { beamPhoneId } from "@/lib/server/beam/beam-session";
import { allowAttempt, createCode, getPhone } from "@/lib/server/beam/beam-store";

// Issues a code for the phone to show; a computer types it into
// /api/beam/connect.
export async function POST() {
  const phoneId = await beamPhoneId("phone");
  // Only a phone that can receive gets a code, so a computer that connects
  // with it can send straight away.
  if (!phoneId || !(await getPhone(phoneId))) {
    return NextResponse.json({ code: "not-subscribed" }, { status: 401 });
  }
  if (!(await allowAttempt(`code:${phoneId}`, 10, BEAM_CODE_TTL_SECONDS))) {
    return NextResponse.json({ code: "too-many-attempts" }, { status: 429 });
  }

  const code = await createCode(phoneId);
  return NextResponse.json({ code, expiresInSeconds: BEAM_CODE_TTL_SECONDS });
}

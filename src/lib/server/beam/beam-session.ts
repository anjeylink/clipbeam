import { cookies } from "next/headers";
import { BEAM_SESSION_COOKIE, isValidBeamSession } from "./beam-auth";

/** Whether the current request comes from a paired device. */
export async function isBeamPaired(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidBeamSession(
    cookieStore.get(BEAM_SESSION_COOKIE)?.value,
    process.env.BEAM_SECRET,
  );
}

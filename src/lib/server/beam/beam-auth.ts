import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// The single-user Beam area is unlocked by BEAM_SECRET (see
// docs/adr/0003-beam-single-secret-web-push.md). A device pairs once by
// entering the key; it then carries this cookie instead of the key itself.
export const BEAM_SESSION_COOKIE = "beam_session";

export const BEAM_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Bumping the label invalidates every paired device without rotating the key.
const SESSION_LABEL = "clipbeam-beam-session-v1";

// Hashing both sides first gives equal-length buffers, which
// timingSafeEqual requires, without leaking the secret's length.
function constantTimeEqual(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}

/** The cookie value a paired device carries for the given secret. */
export function beamSessionToken(secret: string): string {
  return createHmac("sha256", secret).update(SESSION_LABEL).digest("hex");
}

/** Whether a submitted pairing key matches the secret. */
export function isValidBeamKey(key: string, secret: string | undefined): boolean {
  if (!secret) return false;
  return constantTimeEqual(key, secret);
}

/** Whether a beam_session cookie value was issued for the secret. */
export function isValidBeamSession(
  cookieValue: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret || !cookieValue) return false;
  return constantTimeEqual(cookieValue, beamSessionToken(secret));
}

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Beam has no accounts (see docs/adr/0003-beam-phone-code-web-push.md). Both
// ends carry the phone's id in an httpOnly cookie signed with BEAM_SECRET:
// the phone to refresh its subscription and get codes, a connected computer
// to send to it. The role is part of the signature, so a computer's cookie
// can't be replayed as the phone's.
export type BeamRole = "phone" | "computer";

export const BEAM_COOKIES: Record<BeamRole, string> = {
  phone: "beam_phone",
  computer: "beam_computer",
};

export const BEAM_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function newPhoneId(): string {
  return randomBytes(16).toString("base64url");
}

function signature(role: BeamRole, phoneId: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`${role}:${phoneId}`).digest();
}

export function signBeamCookie(role: BeamRole, phoneId: string, secret: string): string {
  return `${phoneId}.${signature(role, phoneId, secret).toString("base64url")}`;
}

/** The phone id a cookie was signed for, or null if it wasn't signed by us for this role. */
export function readBeamCookie(
  role: BeamRole,
  value: string | undefined,
  secret: string | undefined,
): string | null {
  if (!value || !secret) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;

  const phoneId = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1), "base64url");
  const expected = signature(role, phoneId, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return phoneId;
}

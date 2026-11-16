// Shared by the Beam UI and its API routes (see
// docs/adr/0003-beam-phone-code-web-push.md).

// A pairing code: shown on the phone, typed on the computer.
export const BEAM_CODE_LENGTH = 6;

export const BEAM_CODE_TTL_SECONDS = 10 * 60;

const BEAM_CODE_PATTERN = new RegExp(`^\\d{${BEAM_CODE_LENGTH}}$`);

/** Drops the spaces and dashes people type when copying "123 456". */
export function normalizeBeamCode(input: string): string {
  return input.replace(/[\s-]/g, "");
}

export function isBeamCode(value: string): boolean {
  return BEAM_CODE_PATTERN.test(value);
}

/** "123456" → "123 456", easier to read across a desk. */
export function formatBeamCode(code: string): string {
  const half = BEAM_CODE_LENGTH / 2;
  return `${code.slice(0, half)} ${code.slice(half)}`;
}

// /beam?notice=phone-gone: the send form gave way to the code form because
// the phone stopped receiving.
export const BEAM_NOTICE_PARAM = "notice";
export const PHONE_GONE_NOTICE = "phone-gone";

// /beam?device=phone|computer overrides the user-agent guess of which half
// of Beam to show.
export const BEAM_DEVICE_PARAM = "device";
export type BeamDeviceView = "phone" | "computer";

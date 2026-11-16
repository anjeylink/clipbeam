import { describe, expect, it } from "vitest";
import { newPhoneId, readBeamCookie, signBeamCookie } from "./beam-auth";

const SECRET = "s3cret";

describe("beam cookies", () => {
  it("round-trip the phone id for the role they were signed for", () => {
    const phoneId = newPhoneId();
    expect(readBeamCookie("phone", signBeamCookie("phone", phoneId, SECRET), SECRET)).toBe(
      phoneId,
    );
    expect(
      readBeamCookie("computer", signBeamCookie("computer", phoneId, SECRET), SECRET),
    ).toBe(phoneId);
  });

  it("never carry the secret", () => {
    expect(signBeamCookie("phone", newPhoneId(), SECRET)).not.toContain(SECRET);
  });

  it("can't be replayed in the other role", () => {
    const computer = signBeamCookie("computer", "phone-1", SECRET);
    expect(readBeamCookie("phone", computer, SECRET)).toBeNull();
  });

  it("reject a different phone id under a valid signature", () => {
    const [, sig] = signBeamCookie("computer", "phone-1", SECRET).split(".");
    expect(readBeamCookie("computer", `phone-2.${sig}`, SECRET)).toBeNull();
  });

  it("reject cookies signed with another secret, or with none configured", () => {
    const cookie = signBeamCookie("computer", "phone-1", SECRET);
    expect(readBeamCookie("computer", cookie, "other")).toBeNull();
    expect(readBeamCookie("computer", cookie, undefined)).toBeNull();
    expect(readBeamCookie("computer", cookie, "")).toBeNull();
  });

  it("reject malformed values", () => {
    for (const value of [undefined, "", "no-dot", ".sig-only", "phone-1."]) {
      expect(readBeamCookie("computer", value, SECRET), String(value)).toBeNull();
    }
  });

  it("issue a fresh, unguessable id each time", () => {
    const ids = new Set(Array.from({ length: 100 }, newPhoneId));
    expect(ids.size).toBe(100);
    expect(newPhoneId()).toMatch(/^[\w-]{22}$/);
  });
});

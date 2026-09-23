import { describe, expect, it } from "vitest";
import { beamSessionToken, isValidBeamKey, isValidBeamSession } from "./beam-auth";

describe("isValidBeamKey", () => {
  it("accepts the exact secret", () => {
    expect(isValidBeamKey("s3cret", "s3cret")).toBe(true);
  });

  it("rejects a different key", () => {
    expect(isValidBeamKey("s3cre", "s3cret")).toBe(false);
    expect(isValidBeamKey("", "s3cret")).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    expect(isValidBeamKey("", undefined)).toBe(false);
    expect(isValidBeamKey("anything", "")).toBe(false);
  });
});

describe("isValidBeamSession", () => {
  it("accepts the token issued for the secret", () => {
    expect(isValidBeamSession(beamSessionToken("s3cret"), "s3cret")).toBe(true);
  });

  it("never carries the raw secret", () => {
    expect(beamSessionToken("s3cret")).not.toContain("s3cret");
    expect(isValidBeamSession("s3cret", "s3cret")).toBe(false);
  });

  it("rejects a token issued for another secret", () => {
    expect(isValidBeamSession(beamSessionToken("old"), "new")).toBe(false);
  });

  it("rejects a missing cookie or secret", () => {
    expect(isValidBeamSession(undefined, "s3cret")).toBe(false);
    expect(isValidBeamSession(beamSessionToken("s3cret"), undefined)).toBe(false);
  });
});

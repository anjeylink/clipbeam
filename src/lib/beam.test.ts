import { describe, expect, it } from "vitest";
import { formatBeamCode, isBeamCode, normalizeBeamCode } from "./beam";

describe("normalizeBeamCode", () => {
  it("accepts the code the way the phone displays it", () => {
    expect(normalizeBeamCode("123 456")).toBe("123456");
    expect(normalizeBeamCode(" 123-456 ")).toBe("123456");
  });
});

describe("isBeamCode", () => {
  it("accepts exactly six digits, leading zeros included", () => {
    expect(isBeamCode("012345")).toBe(true);
  });

  it("rejects anything else", () => {
    for (const value of ["", "12345", "1234567", "12345a", "123 456", "１２３４５６"]) {
      expect(isBeamCode(value), value).toBe(false);
    }
  });
});

describe("formatBeamCode", () => {
  it("splits the code in two groups", () => {
    expect(formatBeamCode("012345")).toBe("012 345");
  });
});

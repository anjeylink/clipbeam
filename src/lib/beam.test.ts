import { describe, expect, it } from "vitest";
import { formatBeamCode, hasBeamConnectedCookie, isBeamCode, normalizeBeamCode } from "./beam";

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

describe("hasBeamConnectedCookie", () => {
  it("finds the hint wherever it sits in document.cookie", () => {
    expect(hasBeamConnectedCookie("beam_connected=1")).toBe(true);
    expect(hasBeamConnectedCookie("a=b; beam_connected=1")).toBe(true);
    expect(hasBeamConnectedCookie("beam_connected=1;a=b")).toBe(true);
  });

  it("ignores other cookies and other values", () => {
    for (const value of [
      "",
      "a=b",
      "xbeam_connected=1",
      "beam_connected_old=1",
      "beam_connected=",
      "beam_connected=0",
      "beam_connected=10",
    ]) {
      expect(hasBeamConnectedCookie(value), value).toBe(false);
    }
  });
});

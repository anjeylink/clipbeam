import { describe, it, expect } from "vitest";
import { computeSyndicationToken } from "./twitter-token";

describe("computeSyndicationToken", () => {
  it("is deterministic for the same status id", () => {
    expect(computeSyndicationToken("1234567890123456789")).toBe(
      computeSyndicationToken("1234567890123456789"),
    );
  });

  it("produces different tokens for different status ids", () => {
    expect(computeSyndicationToken("20")).not.toBe(computeSyndicationToken("21"));
  });

  it("returns a non-empty string", () => {
    expect(computeSyndicationToken("20").length).toBeGreaterThan(0);
  });
});

import { describe, it, expect } from "vitest";
import { parseXUrl, validateXUrl } from "./parse-x-url";

describe("validateXUrl", () => {
  it("accepts a well-formed x.com status link", () => {
    expect(validateXUrl("https://x.com/someone/status/123")).toEqual({
      valid: true,
      handle: "someone",
      statusId: "123",
    });
  });

  it("accepts twitter.com as well", () => {
    expect(validateXUrl("https://twitter.com/someone/status/123").valid).toBe(true);
  });

  it("rejects a non-status url", () => {
    expect(validateXUrl("https://example.com/not-a-post").valid).toBe(false);
  });

  it("rejects a malformed x.com url without a status id", () => {
    expect(validateXUrl("https://x.com/someone").valid).toBe(false);
  });
});

describe("parseXUrl", () => {
  it("resolves a video for an even trailing status id", async () => {
    const media = await parseXUrl("https://x.com/someone/status/2");
    expect(media.kind).toBe("video");
    expect(media.qualities).toHaveLength(3);
  });

  it("resolves an image for an odd trailing status id", async () => {
    const media = await parseXUrl("https://x.com/someone/status/3");
    expect(media.kind).toBe("image");
    expect(media.imageUrl).toBeTruthy();
  });

  it("rejects when the handle contains 'error', independent of the status id", async () => {
    await expect(parseXUrl("https://x.com/error/status/123")).rejects.toThrow();
  });
});

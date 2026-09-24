import { afterEach, describe, it, expect, vi } from "vitest";
import {
  instagramShortcode,
  parsePostUrl,
  threadsShortcode,
  validatePostUrl,
  validateXUrl,
  ParsePostUrlError,
} from "./parse-post-url";

describe("validateXUrl", () => {
  it("accepts a well-formed x.com status link", () => {
    expect(validateXUrl("https://x.com/someone/status/123")).toEqual({
      valid: true,
      format: "direct",
      handle: "someone",
      statusId: "123",
    });
  });

  it("accepts twitter.com as well", () => {
    expect(validateXUrl("https://twitter.com/someone/status/123").valid).toBe(true);
  });

  it("accepts mobile.twitter.com", () => {
    expect(validateXUrl("https://mobile.twitter.com/someone/status/123").valid).toBe(true);
  });

  it("accepts a bare url with no scheme", () => {
    expect(validateXUrl("x.com/someone/status/123").valid).toBe(true);
  });

  it("accepts the legacy plural 'statuses' segment", () => {
    expect(validateXUrl("https://twitter.com/someone/statuses/123").valid).toBe(true);
  });

  it("accepts a handle-less /i/status/ link", () => {
    const result = validateXUrl("https://x.com/i/status/123");
    expect(result.valid).toBe(true);
    expect(result.statusId).toBe("123");
  });

  it("accepts a handle-less /i/web/status/ link", () => {
    const result = validateXUrl("https://x.com/i/web/status/123");
    expect(result.valid).toBe(true);
    expect(result.statusId).toBe("123");
  });

  it("tolerates trailing query params, fragments, and /photo or /video suffixes", () => {
    expect(validateXUrl("https://x.com/someone/status/123?s=20&t=abc").valid).toBe(true);
    expect(validateXUrl("https://x.com/someone/status/123#reply").valid).toBe(true);
    expect(validateXUrl("https://x.com/someone/status/123/photo/1").valid).toBe(true);
    expect(validateXUrl("https://x.com/someone/status/123/video/1").valid).toBe(true);
  });

  it("accepts a t.co short link as a plausible, unresolved format", () => {
    const result = validateXUrl("https://t.co/abc123");
    expect(result).toEqual({ valid: true, format: "short-link" });
  });

  it("rejects a non-status url", () => {
    expect(validateXUrl("https://example.com/not-a-post").valid).toBe(false);
  });

  it("rejects a malformed x.com url without a status id", () => {
    expect(validateXUrl("https://x.com/someone").valid).toBe(false);
  });

  it("rejects a domain-spoofing attempt", () => {
    expect(validateXUrl("https://x.com.evil.com/someone/status/123").valid).toBe(false);
    expect(validateXUrl("https://notx.com/someone/status/123").valid).toBe(false);
  });
});

describe("threadsShortcode", () => {
  it("reads the shortcode from a threads.com /@user/post/ link", () => {
    expect(threadsShortcode("https://www.threads.com/@zuck/post/DcwLClnmOrR")).toBe("DcwLClnmOrR");
  });

  it("accepts the legacy threads.net host, no www, and no scheme", () => {
    expect(threadsShortcode("https://threads.net/@zuck/post/DcwLClnmOrR")).toBe("DcwLClnmOrR");
    expect(threadsShortcode("threads.com/@zuck/post/DcwLClnmOrR")).toBe("DcwLClnmOrR");
  });

  it("accepts the handle-less /t/ form", () => {
    expect(threadsShortcode("https://www.threads.com/t/Dcy_A8pGo-m")).toBe("Dcy_A8pGo-m");
  });

  it("accepts dotted usernames", () => {
    expect(threadsShortcode("https://www.threads.com/@some.one_2/post/ABC-_1")).toBe("ABC-_1");
  });

  it("tolerates share-link query params, fragments, and a /media suffix", () => {
    expect(threadsShortcode("https://www.threads.com/@zuck/post/DcwLClnmOrR?xmt=AQG0")).toBe(
      "DcwLClnmOrR",
    );
    expect(threadsShortcode("https://www.threads.com/@zuck/post/DcwLClnmOrR/media")).toBe(
      "DcwLClnmOrR",
    );
    expect(threadsShortcode("https://www.threads.com/@zuck/post/DcwLClnmOrR#x")).toBe(
      "DcwLClnmOrR",
    );
  });

  it("rejects a profile link and lookalike hosts", () => {
    expect(threadsShortcode("https://www.threads.com/@zuck")).toBeNull();
    expect(threadsShortcode("https://threads.com.evil.com/@zuck/post/ABC")).toBeNull();
    expect(threadsShortcode("https://notthreads.com/@zuck/post/ABC")).toBeNull();
  });
});

describe("instagramShortcode", () => {
  it("accepts /p/, /reel/, /reels/ and /tv/ links", () => {
    expect(instagramShortcode("https://www.instagram.com/p/Ddbo7s0lzoy/")).toBe("Ddbo7s0lzoy");
    expect(instagramShortcode("https://www.instagram.com/reel/DdhFkS7KGkZ/")).toBe("DdhFkS7KGkZ");
    expect(instagramShortcode("https://www.instagram.com/reels/DdhFkS7KGkZ")).toBe("DdhFkS7KGkZ");
    expect(instagramShortcode("https://www.instagram.com/tv/CAbc-_12345")).toBe("CAbc-_12345");
  });

  it("accepts a username segment, bare hosts, m., and instagr.am", () => {
    expect(instagramShortcode("https://www.instagram.com/nasa/p/Ddbo7s0lzoy/")).toBe(
      "Ddbo7s0lzoy",
    );
    expect(instagramShortcode("https://www.instagram.com/astro.reid_1/reel/DdhFkS7KGkZ/")).toBe(
      "DdhFkS7KGkZ",
    );
    expect(instagramShortcode("instagram.com/p/Ddbo7s0lzoy")).toBe("Ddbo7s0lzoy");
    expect(instagramShortcode("https://m.instagram.com/p/Ddbo7s0lzoy")).toBe("Ddbo7s0lzoy");
    expect(instagramShortcode("https://instagr.am/p/Ddbo7s0lzoy/")).toBe("Ddbo7s0lzoy");
  });

  it("tolerates the app's share params and fragments", () => {
    expect(instagramShortcode("https://www.instagram.com/reel/DdhFkS7KGkZ/?igsh=MWx0")).toBe(
      "DdhFkS7KGkZ",
    );
    expect(instagramShortcode("https://www.instagram.com/p/Ddbo7s0lzoy/?img_index=1#c")).toBe(
      "Ddbo7s0lzoy",
    );
  });

  it("rejects profiles, stories, audio pages, share links, and lookalike hosts", () => {
    expect(instagramShortcode("https://www.instagram.com/nasa/")).toBeNull();
    expect(instagramShortcode("https://www.instagram.com/stories/nasa/3990495229280545049/")).toBeNull();
    expect(instagramShortcode("https://www.instagram.com/reels/audio/1234567890/")).toBeNull();
    expect(instagramShortcode("https://www.instagram.com/share/reel/BAabc123/")).toBeNull();
    expect(instagramShortcode("https://instagram.com.evil.com/p/Ddbo7s0lzoy")).toBeNull();
    expect(instagramShortcode("https://notinstagram.com/p/Ddbo7s0lzoy")).toBeNull();
  });
});

describe("validatePostUrl", () => {
  it("detects X links, including t.co short links", () => {
    const direct = validatePostUrl("https://x.com/someone/status/123");
    expect(direct).toMatchObject({ valid: true, platform: "x", x: { statusId: "123" } });
    expect(validatePostUrl("https://t.co/abc123")).toMatchObject({ valid: true, platform: "x" });
  });

  it("detects Threads links", () => {
    expect(validatePostUrl("https://www.threads.com/t/Dcy_A8pGo-m")).toEqual({
      valid: true,
      platform: "threads",
      format: "direct",
      shortcode: "Dcy_A8pGo-m",
    });
  });

  it("accepts a Threads share link as a plausible, unresolved format", () => {
    const shareLink = { valid: true, platform: "threads", format: "share-link" };
    expect(validatePostUrl("https://www.threads.com/share/_ob4VZH8D/")).toEqual(shareLink);
    expect(validatePostUrl("threads.net/share/_ob4VZH8D")).toEqual(shareLink);
    expect(validatePostUrl("https://www.threads.com/share/")).toEqual({ valid: false });
    expect(validatePostUrl("https://threads.com.evil.com/share/abc")).toEqual({ valid: false });
  });

  it("detects Instagram links", () => {
    expect(validatePostUrl("https://www.instagram.com/reel/DdhFkS7KGkZ/?igsh=MWx0")).toEqual({
      valid: true,
      platform: "instagram",
      format: "direct",
      shortcode: "DdhFkS7KGkZ",
    });
  });

  it("accepts an Instagram share link as a share link, never as a /<user>/reel/ link", () => {
    const shareLink = { valid: true, platform: "instagram", format: "share-link" };
    expect(validatePostUrl("https://www.instagram.com/share/reel/BAabc123/")).toEqual(shareLink);
    expect(validatePostUrl("https://www.instagram.com/share/p/BAabc123")).toEqual(shareLink);
    expect(validatePostUrl("instagram.com/share/BAabc123")).toEqual(shareLink);
    expect(validatePostUrl("https://www.instagram.com/share/")).toEqual({ valid: false });
  });

  it("rejects anything else", () => {
    expect(validatePostUrl("https://example.com/not-a-post")).toEqual({ valid: false });
    expect(validatePostUrl("https://www.instagram.com/stories/nasa/123/")).toEqual({
      valid: false,
    });
  });
});

describe("parsePostUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves media from a successful /api/resolve response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          postUrl: "https://x.com/someone/status/2",
          authorHandle: "someone",
          kind: "image",
          posterUrl: "/mock/sample-image.jpg",
          imageUrl: "/mock/sample-image.jpg",
        }),
      })),
    );

    const media = await parsePostUrl("https://x.com/someone/status/2");
    expect(media.kind).toBe("image");
    expect(media.authorHandle).toBe("someone");
  });

  it("throws a ParsePostUrlError with the response's error code on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ code: "no-media" }),
      })),
    );

    await expect(parsePostUrl("https://x.com/someone/status/3")).rejects.toMatchObject({
      code: "no-media",
    });
  });

  it("falls back to 'unknown' when the error response has no recognizable code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      })),
    );

    await expect(parsePostUrl("https://x.com/someone/status/4")).rejects.toBeInstanceOf(
      ParsePostUrlError,
    );
    await expect(parsePostUrl("https://x.com/someone/status/4")).rejects.toMatchObject({
      code: "unknown",
    });
  });
});

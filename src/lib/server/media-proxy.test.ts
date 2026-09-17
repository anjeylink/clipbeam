import { describe, expect, it } from "vitest";
import { isProxyableMediaUrl } from "./media-proxy";

describe("isProxyableMediaUrl", () => {
  it("allows https video.twimg.com URLs", () => {
    expect(isProxyableMediaUrl("https://video.twimg.com/vid/1280x720/a.mp4")).toBe(true);
  });

  it("allows https pbs.twimg.com URLs", () => {
    expect(isProxyableMediaUrl("https://pbs.twimg.com/media/a.jpg")).toBe(true);
  });

  it("rejects non-twimg hosts", () => {
    expect(isProxyableMediaUrl("https://evil.example.com/a.mp4")).toBe(false);
  });

  it("rejects a lookalike host", () => {
    expect(isProxyableMediaUrl("https://video.twimg.com.evil.com/a.mp4")).toBe(false);
  });

  it("rejects non-https URLs", () => {
    expect(isProxyableMediaUrl("http://video.twimg.com/vid/1280x720/a.mp4")).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(isProxyableMediaUrl("not-a-url")).toBe(false);
  });
});

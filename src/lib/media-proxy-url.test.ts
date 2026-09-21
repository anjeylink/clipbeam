import { describe, expect, it } from "vitest";
import { mediaProxyUrl } from "./media-proxy-url";

describe("mediaProxyUrl", () => {
  it("encodes the upstream url", () => {
    const href = mediaProxyUrl("https://video.twimg.com/vid/1280x720/a.mp4?tag=1&x=2");
    const params = new URL(href, "http://localhost").searchParams;
    expect(href.startsWith("/api/download?")).toBe(true);
    expect(params.get("url")).toBe("https://video.twimg.com/vid/1280x720/a.mp4?tag=1&x=2");
    expect(params.has("filename")).toBe(false);
  });

  it("adds filename only when given", () => {
    const params = new URL(mediaProxyUrl("https://pbs.twimg.com/a", "clip-1"), "http://localhost")
      .searchParams;
    expect(params.get("filename")).toBe("clip-1");
  });
});

import { describe, expect, it } from "vitest";
import { isProxyableMediaUrl, proxyableRedirectTarget } from "./media-proxy";

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

  it("allows Threads' regional fbcdn.net and cdninstagram.com edges", () => {
    expect(isProxyableMediaUrl("https://instagram.flwo3-1.fna.fbcdn.net/o1/v/a.mp4?oe=1")).toBe(
      true,
    );
    expect(isProxyableMediaUrl("https://scontent.cdninstagram.com/v/a.jpg")).toBe(true);
  });

  it("only matches Threads suffixes on a dot boundary", () => {
    expect(isProxyableMediaUrl("https://evilfbcdn.net/a.mp4")).toBe(false);
    expect(isProxyableMediaUrl("https://fbcdn.net/a.mp4")).toBe(false);
    expect(isProxyableMediaUrl("https://x.fbcdn.net.evil.com/a.mp4")).toBe(false);
    expect(isProxyableMediaUrl("https://evilcdninstagram.com/a.jpg")).toBe(false);
  });

  it("rejects http and IP-literal Threads-looking URLs", () => {
    expect(isProxyableMediaUrl("http://scontent.cdninstagram.com/v/a.jpg")).toBe(false);
    expect(isProxyableMediaUrl("https://157.240.1.1/v/a.jpg")).toBe(false);
  });

  it("scopes the check to one Platform when given", () => {
    expect(isProxyableMediaUrl("https://pbs.twimg.com/a.jpg", "threads")).toBe(false);
    expect(isProxyableMediaUrl("https://scontent.cdninstagram.com/a.jpg", "x")).toBe(false);
    expect(isProxyableMediaUrl("https://scontent.cdninstagram.com/a.jpg", "threads")).toBe(true);
  });

  it("allows Meta's edges for Instagram, and nothing of X's", () => {
    expect(
      isProxyableMediaUrl("https://instagram.flwo3-1.fna.fbcdn.net/o1/v/a.mp4", "instagram"),
    ).toBe(true);
    expect(isProxyableMediaUrl("https://scontent.cdninstagram.com/a.jpg", "instagram")).toBe(true);
    expect(isProxyableMediaUrl("https://video.twimg.com/a.mp4", "instagram")).toBe(false);
    expect(isProxyableMediaUrl("https://evilcdninstagram.com/a.jpg", "instagram")).toBe(false);
  });
});

describe("proxyableRedirectTarget", () => {
  const from = "https://instagram.flwo3-1.fna.fbcdn.net/o1/v/a.mp4";

  it("follows a redirect to another allowlisted edge", () => {
    expect(proxyableRedirectTarget(from, "https://scontent.cdninstagram.com/o1/v/a.mp4")).toBe(
      "https://scontent.cdninstagram.com/o1/v/a.mp4",
    );
  });

  it("resolves a relative Location against the current URL", () => {
    expect(proxyableRedirectTarget(from, "/o1/v/b.mp4")).toBe(
      "https://instagram.flwo3-1.fna.fbcdn.net/o1/v/b.mp4",
    );
  });

  it("refuses a redirect off the allowlist, to http, or with no Location", () => {
    expect(proxyableRedirectTarget(from, "https://evil.example.com/a.mp4")).toBeNull();
    expect(proxyableRedirectTarget(from, "http://scontent.cdninstagram.com/a.mp4")).toBeNull();
    expect(proxyableRedirectTarget(from, "http://169.254.169.254/latest")).toBeNull();
    expect(proxyableRedirectTarget(from, null)).toBeNull();
  });
});

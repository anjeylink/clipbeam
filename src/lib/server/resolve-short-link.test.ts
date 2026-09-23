import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveShortLink,
  ShortLinkResolutionError,
  THREADS_SHARE_LINK_POLICY,
} from "./resolve-short-link";

function mockRedirectChain(responses: Array<{ status: number; location?: string }>) {
  let call = 0;
  return vi.fn(async () => {
    const step = responses[call];
    call += 1;
    return {
      status: step.status,
      headers: {
        get: (name: string) => (name === "location" ? (step.location ?? null) : null),
      },
    } as Response;
  });
}

describe("resolveShortLink", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a url whose host isn't t.co", async () => {
    await expect(resolveShortLink("https://x.com/someone/status/1")).rejects.toThrow(
      ShortLinkResolutionError,
    );
  });

  it("follows a normal redirect chain to x.com", async () => {
    vi.stubGlobal(
      "fetch",
      mockRedirectChain([
        { status: 301, location: "https://x.com/XDevelopers/status/123" },
        { status: 200 },
      ]),
    );

    const resolved = await resolveShortLink("https://t.co/abc123");
    expect(resolved).toBe("https://x.com/XDevelopers/status/123");
  });

  it("follows a relative Location header against the current URL", async () => {
    // Models a real captured case: t.co lands on twitter.com, which then
    // issues a same-host relative redirect (e.g. after an account rename).
    vi.stubGlobal(
      "fetch",
      mockRedirectChain([
        { status: 301, location: "https://twitter.com/TwitterDev/status/1" },
        { status: 301, location: "/XDevelopers/status/1" },
        { status: 200 },
      ]),
    );

    const resolved = await resolveShortLink("https://t.co/abc123");
    expect(resolved).toBe("https://twitter.com/XDevelopers/status/1");
  });

  it("rejects a redirect to a non-https target", async () => {
    vi.stubGlobal("fetch", mockRedirectChain([{ status: 301, location: "http://x.com/a/status/1" }]));
    await expect(resolveShortLink("https://t.co/abc123")).rejects.toThrow(
      ShortLinkResolutionError,
    );
  });

  it("rejects a redirect landing on a bare IP literal", async () => {
    vi.stubGlobal(
      "fetch",
      mockRedirectChain([{ status: 301, location: "https://169.254.169.254/latest/meta-data" }]),
    );
    await expect(resolveShortLink("https://t.co/abc123")).rejects.toThrow(
      ShortLinkResolutionError,
    );
  });

  it("rejects once the hop cap is exceeded", async () => {
    vi.stubGlobal(
      "fetch",
      mockRedirectChain(
        Array.from({ length: 10 }, (_, i) => ({
          status: 301,
          location: `https://example.com/hop-${i}`,
        })),
      ),
    );
    await expect(resolveShortLink("https://t.co/abc123")).rejects.toThrow(
      ShortLinkResolutionError,
    );
  });

  it("rejects a final host that isn't an allowed X domain", async () => {
    vi.stubGlobal(
      "fetch",
      mockRedirectChain([
        { status: 301, location: "https://example.com/" },
        { status: 200 },
      ]),
    );
    await expect(resolveShortLink("https://t.co/abc123")).rejects.toThrow(
      ShortLinkResolutionError,
    );
  });

  it("propagates a timeout as a rejection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timeout", "TimeoutError");
      }),
    );
    await expect(resolveShortLink("https://t.co/abc123")).rejects.toThrow();
  });

  describe("with the Threads share-link policy", () => {
    it("follows a threads.com/share link to the canonical post URL", async () => {
      vi.stubGlobal(
        "fetch",
        mockRedirectChain([
          { status: 302, location: "https://www.threads.com/@someone/post/ABC123?xmt=x&slof=1" },
          { status: 200 },
        ]),
      );
      const resolved = await resolveShortLink(
        "https://www.threads.com/share/_ob4VZH8D/",
        THREADS_SHARE_LINK_POLICY,
      );
      expect(resolved).toBe("https://www.threads.com/@someone/post/ABC123?xmt=x&slof=1");
    });

    it("rejects a t.co link, and a share link that lands off Threads", async () => {
      await expect(
        resolveShortLink("https://t.co/abc123", THREADS_SHARE_LINK_POLICY),
      ).rejects.toThrow(ShortLinkResolutionError);

      vi.stubGlobal(
        "fetch",
        mockRedirectChain([{ status: 302, location: "https://evil.example.com/" }, { status: 200 }]),
      );
      await expect(
        resolveShortLink("https://www.threads.com/share/abc/", THREADS_SHARE_LINK_POLICY),
      ).rejects.toThrow(ShortLinkResolutionError);
    });
  });
});

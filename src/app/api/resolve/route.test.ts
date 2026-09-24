import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function fixture(platform: "threads" | "instagram", name: string): string {
  return readFileSync(
    join(__dirname, "../../../lib/server/__fixtures__", platform, `${name}.html`),
    "utf8",
  );
}

const threadsFixture = (name: string) => fixture("threads", name);
const instagramFixture = (name: string) => fixture("instagram", name);

// Answers Threads/Instagram page fetches from fixtures and HEAD size probes
// with a fixed Content-Length, recording which URLs were requested with
// which UA. `finalUrl` stands in for where fetch's redirect-following ended.
function stubPages(
  pages: Record<
    string,
    { status?: number; html?: string; location?: string; finalUrl?: string }
  >,
) {
  const calls: { url: string; userAgent?: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === "HEAD") {
        const redirect = pages[url]?.location;
        if (redirect) {
          return { ok: false, status: 302, headers: new Headers({ location: redirect }) };
        }
        return { ok: true, status: 200, headers: new Headers({ "content-length": "3963126" }) };
      }
      calls.push({ url, userAgent: new Headers(init?.headers).get("user-agent") ?? undefined });
      const page = pages[url] ?? { status: 404 };
      const status = page.status ?? 200;
      return {
        ok: status < 400,
        status,
        url: page.finalUrl ?? url,
        text: async () => page.html ?? "",
      };
    }),
  );
  return calls;
}

function makeRequest(url: string) {
  return new NextRequest(`http://localhost/api/resolve?url=${encodeURIComponent(url)}`);
}

describe("GET /api/resolve", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("400s on an obviously invalid url without hitting the network", async () => {
    const res = await GET(makeRequest("https://example.com/not-a-post"));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid-format");
  });

  it("resolves a video tweet to a ParsedMedia payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          __typename: "Tweet",
          user: { screen_name: "someone" },
          mediaDetails: [
            {
              type: "video",
              media_url_https: "https://pbs.twimg.com/poster.jpg",
              video_info: {
                duration_millis: 11093,
                variants: [
                  {
                    content_type: "video/mp4",
                    url: "https://video.twimg.com/vid/1280x720/a.mp4",
                    bitrate: 2176000,
                  },
                ],
              },
            },
          ],
        }),
      })),
    );

    const res = await GET(makeRequest("https://x.com/someone/status/123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("video");
    expect(body.authorHandle).toBe("someone");
    expect(body.qualities).toHaveLength(1);
    // Proxied, not the raw video.twimg.com URL: video hotlinking 403s.
    expect(body.qualities[0].proxiedUrl).toMatch(/^\/api\/download\?url=/);
    expect(body.qualities[0].url).toBeUndefined();
  });

  it("resolves a photo tweet with a raw, unproxied previewUrl and a proxied download url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          __typename: "Tweet",
          user: { screen_name: "someone" },
          mediaDetails: [{ type: "photo", media_url_https: "https://pbs.twimg.com/a.jpg" }],
        }),
      })),
    );

    const res = await GET(makeRequest("https://x.com/someone/status/123"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe("image");
    // pbs.twimg.com allows hotlinking, so the preview skips our proxy.
    expect(body.previewUrl).toBe("https://pbs.twimg.com/a.jpg");
    expect(body.proxiedUrl).toMatch(/^\/api\/download\?url=/);
  });

  it("rejects media on a host outside the proxy allowlist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          __typename: "Tweet",
          user: { screen_name: "someone" },
          mediaDetails: [{ type: "photo", media_url_https: "https://evil.example.com/a.jpg" }],
        }),
      })),
    );

    const res = await GET(makeRequest("https://x.com/someone/status/123"));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("unsupported-media-host");
  });

  it("maps a 404 from the syndication endpoint to not-found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404 })));
    const res = await GET(makeRequest("https://x.com/someone/status/123"));
    expect(res.status).toBe(404);
    expect((await res.json()).code).toBe("not-found");
  });

  it("maps a 429 from the syndication endpoint to rate-limited", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 429 })));
    const res = await GET(makeRequest("https://x.com/someone/status/123"));
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe("rate-limited");
  });

  it("maps a tombstoned tweet to unsupported-post", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ __typename: "TweetTombstone" }),
      })),
    );
    const res = await GET(makeRequest("https://x.com/someone/status/123"));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("unsupported-post");
  });

  it("maps a multi-photo tweet to multi-media-unsupported", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          __typename: "Tweet",
          user: { screen_name: "someone" },
          mediaDetails: [
            { type: "photo", media_url_https: "https://pbs.twimg.com/a.jpg" },
            { type: "photo", media_url_https: "https://pbs.twimg.com/b.jpg" },
          ],
        }),
      })),
    );
    const res = await GET(makeRequest("https://x.com/someone/status/123"));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("multi-media-unsupported");
  });

  describe("Threads", () => {
    const EMBED = (code: string) => `https://www.threads.com/t/${code}/embed`;
    const PAGE = (code: string) => `https://www.threads.com/t/${code}`;

    it("resolves a video post from the embed alone, fully proxied", async () => {
      const calls = stubPages({ [EMBED("DcwLClnmOrR")]: { html: threadsFixture("embed-video") } });

      const res = await GET(makeRequest("https://www.threads.com/@zuck/post/DcwLClnmOrR?xmt=AQG"));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ platform: "threads", kind: "video", authorHandle: "zuck" });
      expect(body.qualities).toHaveLength(1);
      expect(body.qualities[0].label).toBeNull();
      expect(body.qualities[0].approxSizeMb).toBeCloseTo(3.96, 2);
      expect(body.qualities[0].proxiedUrl).toMatch(/^\/api\/download\?url=/);
      expect(calls.map((c) => c.url)).toEqual([EMBED("DcwLClnmOrR")]);
      expect(calls[0].userAgent).toBe("ClipBeam/1.0");
    });

    it("takes the author from the page, not from a wrong @user in the link", async () => {
      stubPages({ [EMBED("Dcy_A8pGo-m")]: { html: threadsFixture("embed-image") } });

      const res = await GET(makeRequest("https://www.threads.net/@someone.else/post/Dcy_A8pGo-m"));
      const body = await res.json();
      expect(body).toMatchObject({ platform: "threads", kind: "image", authorHandle: "zuck" });
      expect(body.previewUrl).toMatch(/^\/api\/download\?url=/);
    });

    it("follows a threads.com/share link to the post before resolving it", async () => {
      const calls = stubPages({
        "https://www.threads.com/share/_ob4VZH8D/": {
          location: "https://www.threads.com/@zuck/post/DcwLClnmOrR?xmt=AQG0&slof=1",
        },
        [EMBED("DcwLClnmOrR")]: { html: threadsFixture("embed-video") },
      });

      const res = await GET(makeRequest("https://www.threads.com/share/_ob4VZH8D/"));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({
        platform: "threads",
        kind: "video",
        postUrl: "https://www.threads.com/@zuck/post/DcwLClnmOrR",
      });
      expect(calls.map((c) => c.url)).toEqual([EMBED("DcwLClnmOrR")]);
    });

    it("maps a share link that doesn't redirect to a post to not-found", async () => {
      stubPages({});

      const res = await GET(makeRequest("https://www.threads.com/share/zzzzzzzzz/"));
      expect(res.status).toBe(404);
      expect((await res.json()).code).toBe("not-found");
    });

    it("falls back to the crawler-UA post page when the embed has no media", async () => {
      const calls = stubPages({
        [EMBED("DdZ7sQvkTFn")]: { html: threadsFixture("embed-text") },
        [PAGE("DdZ7sQvkTFn")]: { html: threadsFixture("page-text") },
      });

      const res = await GET(makeRequest("https://www.threads.com/t/DdZ7sQvkTFn"));
      expect(res.status).toBe(422);
      expect((await res.json()).code).toBe("no-media");
      expect(calls.map((c) => c.url)).toEqual([EMBED("DdZ7sQvkTFn"), PAGE("DdZ7sQvkTFn")]);
      expect(calls[1].userAgent).toMatch(/Googlebot/);
    });

    it("never returns a quoted post's video for a text post that quotes it", async () => {
      stubPages({
        [EMBED("DdHp9gDkmnV")]: { html: threadsFixture("embed-quote-of-video") },
        [PAGE("DdHp9gDkmnV")]: { html: threadsFixture("page-quote-of-video") },
      });

      const res = await GET(makeRequest("https://www.threads.com/@instagram/post/DdHp9gDkmnV"));
      expect(res.status).toBe(422);
      expect((await res.json()).code).toBe("no-media");
    });

    it("rejects a carousel straight from the embed", async () => {
      const calls = stubPages({
        [EMBED("DZ7eGA1G7wU")]: { html: threadsFixture("embed-carousel") },
      });

      const res = await GET(makeRequest("https://www.threads.com/@zuck/post/DZ7eGA1G7wU"));
      expect(res.status).toBe(422);
      expect((await res.json()).code).toBe("multi-media-unsupported");
      expect(calls).toHaveLength(1);
    });

    it("maps an unavailable post to not-found without a fallback request", async () => {
      const calls = stubPages({ [EMBED("DzzzzzzzzzZ")]: { html: threadsFixture("embed-missing") } });

      const res = await GET(makeRequest("https://www.threads.com/t/DzzzzzzzzzZ"));
      expect(res.status).toBe(404);
      expect((await res.json()).code).toBe("not-found");
      expect(calls).toHaveLength(1);
    });

    it("maps a 403 from Threads to rate-limited", async () => {
      stubPages({ [EMBED("DcwLClnmOrR")]: { status: 403 } });

      const res = await GET(makeRequest("https://www.threads.com/t/DcwLClnmOrR"));
      expect(res.status).toBe(429);
      expect((await res.json()).code).toBe("rate-limited");
    });
  });

  describe("Instagram", () => {
    const EMBED = (code: string) => `https://www.instagram.com/p/${code}/embed/captioned/`;
    const PAGE = (code: string) => `https://www.instagram.com/p/${code}/`;

    it("resolves a Reel from the embed alone, labelled and fully proxied", async () => {
      const calls = stubPages({ [EMBED("DdhFkS7KGkZ")]: { html: instagramFixture("embed-video") } });

      const res = await GET(
        makeRequest("https://www.instagram.com/reel/DdhFkS7KGkZ/?igsh=MWx0bGZ5"),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        platform: "instagram",
        kind: "video",
        authorHandle: "ravens",
        postUrl: "https://www.instagram.com/p/DdhFkS7KGkZ/",
      });
      expect(body.qualities).toHaveLength(1);
      expect(body.qualities[0].label).toBe("720p");
      expect(body.qualities[0].approxSizeMb).toBeCloseTo(3.96, 2);
      expect(body.qualities[0].proxiedUrl).toMatch(/^\/api\/download\?url=/);
      expect(body.posterUrl).toMatch(/^\/api\/download\?url=/);
      expect(calls.map((c) => c.url)).toEqual([EMBED("DdhFkS7KGkZ")]);
      expect(calls[0].userAgent).toBe("ClipBeam/1.0");
    });

    it("resolves an image with a proxied preview, whatever username the link carries", async () => {
      stubPages({ [EMBED("Ddbo7s0lzoy")]: { html: instagramFixture("embed-image") } });

      const res = await GET(makeRequest("https://www.instagram.com/someone.else/p/Ddbo7s0lzoy/"));
      const body = await res.json();
      expect(body).toMatchObject({ platform: "instagram", kind: "image", authorHandle: "nasa" });
      expect(body.previewUrl).toMatch(/^\/api\/download\?url=/);
    });

    it("follows an instagram.com/share link to the post before resolving it", async () => {
      const calls = stubPages({
        "https://www.instagram.com/share/reel/BAabc123/": {
          location: "https://www.instagram.com/reel/DdhFkS7KGkZ/?igsh=MWx0",
        },
        [EMBED("DdhFkS7KGkZ")]: { html: instagramFixture("embed-video") },
      });

      const res = await GET(makeRequest("https://www.instagram.com/share/reel/BAabc123/"));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ platform: "instagram", kind: "video" });
      expect(calls.map((c) => c.url)).toEqual([EMBED("DdhFkS7KGkZ")]);
    });

    it("maps a share link that doesn't redirect to a post to not-found", async () => {
      stubPages({});

      const res = await GET(makeRequest("https://www.instagram.com/share/zzzzzzzzz/"));
      expect(res.status).toBe(404);
      expect((await res.json()).code).toBe("not-found");
    });

    it("falls back to the crawler-UA post page when the embed is inconclusive", async () => {
      const calls = stubPages({
        [EMBED("DdhFkS7KGkZ")]: { html: "<html><body></body></html>" },
        [PAGE("DdhFkS7KGkZ")]: { html: instagramFixture("page-video") },
      });

      const res = await GET(makeRequest("https://www.instagram.com/reel/DdhFkS7KGkZ/"));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ platform: "instagram", kind: "video" });
      expect(calls.map((c) => c.url)).toEqual([EMBED("DdhFkS7KGkZ"), PAGE("DdhFkS7KGkZ")]);
      expect(calls[1].userAgent).toMatch(/Googlebot/);
    });

    it("rejects a carousel straight from the embed", async () => {
      const calls = stubPages({
        [EMBED("DdZMsPElzSl")]: { html: instagramFixture("embed-carousel") },
      });

      const res = await GET(makeRequest("https://www.instagram.com/p/DdZMsPElzSl/"));
      expect(res.status).toBe(422);
      expect((await res.json()).code).toBe("multi-media-unsupported");
      expect(calls).toHaveLength(1);
    });

    it("maps an unavailable post to not-found without a fallback request", async () => {
      const calls = stubPages({
        [EMBED("Zz0000000000")]: { html: instagramFixture("embed-missing") },
      });

      const res = await GET(makeRequest("https://www.instagram.com/p/Zz0000000000/"));
      expect(res.status).toBe(404);
      expect((await res.json()).code).toBe("not-found");
      expect(calls).toHaveLength(1);
    });

    it("maps a 429, or a bounce to the login page, to rate-limited", async () => {
      stubPages({ [EMBED("DdhFkS7KGkZ")]: { status: 429 } });
      let res = await GET(makeRequest("https://www.instagram.com/reel/DdhFkS7KGkZ/"));
      expect(res.status).toBe(429);
      expect((await res.json()).code).toBe("rate-limited");

      stubPages({
        [EMBED("DdhFkS7KGkZ")]: {
          html: "<html></html>",
          finalUrl: "https://www.instagram.com/accounts/login/?next=%2Fp%2FDdhFkS7KGkZ%2F",
        },
      });
      res = await GET(makeRequest("https://www.instagram.com/reel/DdhFkS7KGkZ/"));
      expect(res.status).toBe(429);
      expect((await res.json()).code).toBe("rate-limited");
    });
  });
});

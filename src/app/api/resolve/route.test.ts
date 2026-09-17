import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

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

  it("resolves a video tweet to a ParsedXMedia payload", async () => {
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
});

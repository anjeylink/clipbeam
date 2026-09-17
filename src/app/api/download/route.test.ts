import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function makeRequest(url?: string) {
  const query = url ? `?url=${encodeURIComponent(url)}` : "";
  return new NextRequest(`http://localhost/api/download${query}`);
}

describe("GET /api/download", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("400s when no url is given", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid-url");
  });

  it("400s on a url outside the twimg.com allowlist, without hitting the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await GET(makeRequest("https://evil.example.com/a.mp4"));

    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid-url");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("streams an upstream video.twimg.com response back with its content-type and length", async () => {
    const body = new ReadableStream();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        body,
        headers: new Headers({ "content-type": "video/mp4", "content-length": "12345" }),
      })),
    );

    const res = await GET(makeRequest("https://video.twimg.com/vid/1280x720/a.mp4"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("video/mp4");
    expect(res.headers.get("content-length")).toBe("12345");
  });

  it("forwards an upstream 403 instead of masking it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, body: null, headers: new Headers() })),
    );

    const res = await GET(makeRequest("https://video.twimg.com/vid/1280x720/a.mp4"));

    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("upstream-error");
  });

  it("502s when the upstream fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const res = await GET(makeRequest("https://video.twimg.com/vid/1280x720/a.mp4"));

    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("upstream-unreachable");
  });
});

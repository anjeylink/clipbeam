import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function makeRequest(url?: string, filename?: string, headers?: HeadersInit) {
  const params = new URLSearchParams();
  if (url) params.set("url", url);
  if (filename !== undefined) params.set("filename", filename);
  const query = params.size ? `?${params}` : "";
  return new NextRequest(`http://localhost/api/download${query}`, { headers });
}

function stubUpstream(contentType: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      status: 200,
      body: new ReadableStream(),
      headers: new Headers({ "content-type": contentType }),
    })),
  );
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

  it("forwards a Range request upstream and passes the 206 back so <video> can seek", async () => {
    const fetchSpy = vi.fn<typeof fetch>(async () => ({
      ok: true,
      status: 206,
      body: new ReadableStream(),
      headers: new Headers({
        "content-type": "video/mp4",
        "content-length": "1000",
        "content-range": "bytes 0-999/5000",
      }),
    }) as unknown as Response);
    vi.stubGlobal("fetch", fetchSpy);

    const res = await GET(
      makeRequest("https://video.twimg.com/vid/1280x720/a.mp4", undefined, {
        range: "bytes=0-999",
      }),
    );

    expect(fetchSpy.mock.calls[0][1]).toMatchObject({ headers: { Range: "bytes=0-999" } });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-999/5000");
    expect(res.headers.get("accept-ranges")).toBe("bytes");
  });

  it("sends no Content-Disposition when no filename is requested", async () => {
    stubUpstream("video/mp4");

    const res = await GET(makeRequest("https://video.twimg.com/vid/1280x720/a.mp4"));

    expect(res.headers.get("content-disposition")).toBeNull();
  });

  it("marks the response as an attachment named from the filename param and content-type", async () => {
    stubUpstream("image/png");

    const res = await GET(
      makeRequest("https://pbs.twimg.com/media/a?format=png", "clipbeam-jack-image"),
    );

    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="clipbeam-jack-image.png"',
    );
  });

  it("sanitizes a hostile filename param", async () => {
    stubUpstream("video/mp4");

    const res = await GET(
      makeRequest("https://video.twimg.com/vid/1280x720/a.mp4", '../x"\r\nSet-Cookie: a=b'),
    );

    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="_x___Set-Cookie__a_b.mp4"',
    );
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

  it("follows a CDN redirect to another allowlisted Threads edge", async () => {
    const fetchSpy = vi.fn(async (input: string | URL) => {
      if (String(input).includes("fbcdn.net")) {
        return {
          ok: false,
          status: 302,
          body: null,
          headers: new Headers({ location: "https://scontent.cdninstagram.com/o1/v/a.mp4" }),
        };
      }
      return {
        ok: true,
        status: 200,
        body: new ReadableStream(),
        headers: new Headers({ "content-type": "video/mp4" }),
      };
    });
    vi.stubGlobal("fetch", fetchSpy);

    const res = await GET(makeRequest("https://instagram.flwo3-1.fna.fbcdn.net/o1/v/a.mp4"));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(String(fetchSpy.mock.calls[1][0])).toBe("https://scontent.cdninstagram.com/o1/v/a.mp4");
    for (const [, init] of fetchSpy.mock.calls as unknown as [string, RequestInit][]) {
      expect(init.redirect).toBe("manual");
    }
  });

  it("refuses to follow a redirect off the allowlist", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: false,
      status: 302,
      body: null,
      headers: new Headers({ location: "https://evil.example.com/a.mp4" }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await GET(makeRequest("https://scontent.cdninstagram.com/o1/v/a.mp4"));

    expect(res.status).toBe(502);
    expect((await res.json()).code).toBe("upstream-error");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("gives up after too many redirect hops", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: false,
      status: 302,
      body: null,
      headers: new Headers({ location: "https://scontent.cdninstagram.com/loop.mp4" }),
    }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await GET(makeRequest("https://scontent.cdninstagram.com/loop.mp4"));

    expect(res.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });
});

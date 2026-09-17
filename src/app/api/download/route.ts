import { NextRequest, NextResponse } from "next/server";
import { isProxyableMediaUrl } from "@/lib/server/media-proxy";

// Twitter's CDN routinely 403s video.twimg.com requests made directly from
// the browser (unlike pbs.twimg.com, which allows open hotlinking) — almost
// certainly anti-hotlink filtering on the Origin/Referer headers a browser
// fetch sends cross-origin. Proxying the request through our own server
// sidesteps that, since a server-side fetch carries neither header.
export async function GET(request: NextRequest) {
  const mediaUrl = request.nextUrl.searchParams.get("url");
  if (!mediaUrl || !isProxyableMediaUrl(mediaUrl)) {
    return NextResponse.json({ code: "invalid-url" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(mediaUrl, { cache: "no-store" });
  } catch {
    return NextResponse.json({ code: "upstream-unreachable" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ code: "upstream-error" }, { status: upstream.status || 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const contentLength = upstream.headers.get("content-length");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  headers.set("Cache-Control", "private, max-age=3600");

  return new NextResponse(upstream.body, { status: 200, headers });
}

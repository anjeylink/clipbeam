import { NextRequest, NextResponse } from "next/server";
import { isProxyableMediaUrl } from "@/lib/server/media-proxy";
import { extensionFromMimeType, sanitizeFilenameBase } from "@/lib/media-filename";

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
    // Range is forwarded so <video> can seek (and Safari will play at all);
    // the signal stops the upstream fetch when the browser drops a request.
    const range = request.headers.get("range");
    upstream = await fetch(mediaUrl, {
      cache: "no-store",
      headers: range ? { Range: range } : undefined,
      signal: request.signal,
    });
  } catch {
    return NextResponse.json({ code: "upstream-unreachable" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ code: "upstream-error" }, { status: upstream.status || 502 });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, max-age=3600");

  // With `filename` the response is a save-to-disk download: the browser
  // starts streaming it straight to a file, with no client-side buffering.
  // Without it (the Share flow's blob prefetch) the response is left inline.
  const filenameBase = request.nextUrl.searchParams.get("filename");
  if (filenameBase !== null) {
    const extension = extensionFromMimeType(contentType ?? "");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${sanitizeFilenameBase(filenameBase)}.${extension}"`,
    );
  }

  return new NextResponse(upstream.body, { status: upstream.status, headers });
}

/**
 * Same-origin URL for a twimg media file, served through /api/download.
 * video.twimg.com 403s requests that carry a browser Referer/Origin, so
 * every browser-facing reference to a video URL (preview playback, the
 * Share blob, download) goes through the proxy. Called server-side, from
 * toClientMedia, so the client never sees a raw upstream URL to forget to
 * wrap. Passing `filename` (base name, no extension) makes the response a
 * save-to-disk attachment.
 */
export function mediaProxyUrl(rawUrl: string, filename?: string): string {
  const params = new URLSearchParams({ url: rawUrl });
  if (filename !== undefined) params.set("filename", filename);
  return `/api/download?${params}`;
}

/**
 * Same-origin URL for a twimg media file, served through /api/download.
 * video.twimg.com 403s requests that carry a browser Referer/Origin, so
 * every browser-side use of a video URL (preview playback, download, the
 * Share blob) goes through the proxy. Passing `filename` (base name, no
 * extension) makes the response a save-to-disk attachment.
 */
export function mediaProxyUrl(rawUrl: string, filename?: string): string {
  const params = new URLSearchParams({ url: rawUrl });
  if (filename !== undefined) params.set("filename", filename);
  return `/api/download?${params}`;
}

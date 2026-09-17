// Twitter/X's CDN hosts we're willing to fetch server-side on a client's
// behalf. Keeping this an exact-hostname allowlist (not a suffix/substring
// check) is what keeps /api/download from becoming an open proxy for
// arbitrary URLs.
const ALLOWED_MEDIA_HOSTS = new Set(["video.twimg.com", "pbs.twimg.com"]);

export function isProxyableMediaUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  return parsed.protocol === "https:" && ALLOWED_MEDIA_HOSTS.has(parsed.hostname);
}

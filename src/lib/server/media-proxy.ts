import type { Platform } from "@/lib/media-types";

// CDN hosts we're willing to fetch server-side on a client's behalf, per
// Platform (see docs/adr/0002-per-platform-suffix-allowlist.md). X's hosts
// are fixed, so they stay an exact-hostname allowlist. Instagram and Threads
// are served from Meta's regional edges (instagram.<edge>.fna.fbcdn.net,
// scontent.cdninstagram.com, …) whose names change, so they're matched by
// dot-anchored suffix — never a bare substring check, which is what would
// turn /api/download into an open proxy for arbitrary URLs.
interface HostRule {
  exact?: ReadonlySet<string>;
  suffixes?: readonly string[];
}

const HOST_RULES: Record<Platform, HostRule> = {
  x: { exact: new Set(["video.twimg.com", "pbs.twimg.com"]) },
  instagram: { suffixes: [".fbcdn.net", ".cdninstagram.com"] },
  threads: { suffixes: [".fbcdn.net", ".cdninstagram.com"] },
};

function hostMatches(hostname: string, rule: HostRule): boolean {
  if (rule.exact?.has(hostname)) return true;
  return rule.suffixes?.some((suffix) => hostname.endsWith(suffix)) ?? false;
}

/**
 * True for an https URL on an allowlisted CDN host — of the given Platform
 * or, when none is given (the proxy itself, which doesn't know where a URL
 * came from), of any Platform.
 */
export function isProxyableMediaUrl(rawUrl: string, platform?: Platform): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname.toLowerCase();
  const rules = platform ? [HOST_RULES[platform]] : Object.values(HOST_RULES);
  return rules.some((rule) => hostMatches(hostname, rule));
}

/**
 * Where a CDN redirect from `currentUrl` points, if it's still proxyable —
 * null otherwise. The proxy follows redirects itself (never `fetch`'s
 * automatic following) so every hop is re-checked against the allowlist:
 * an allowlisted host must not be able to bounce us to an arbitrary one.
 */
export function proxyableRedirectTarget(currentUrl: string, location: string | null): string | null {
  if (!location) return null;
  let next: URL;
  try {
    next = new URL(location, currentUrl);
  } catch {
    return null;
  }
  const href = next.toString();
  return isProxyableMediaUrl(href) ? href : null;
}

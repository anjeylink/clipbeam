const MAX_REDIRECT_HOPS = 5;
const REDIRECT_TIMEOUT_MS = 5000;

const ALLOWED_FINAL_HOSTS = new Set(["x.com", "twitter.com", "mobile.twitter.com"]);

// Rejects bare IPv4/IPv6 literals as redirect targets — a t.co link is
// attacker-influenceable (anyone can get X to mint one pointing anywhere),
// so a redirect landing directly on an IP literal (e.g. cloud metadata
// addresses) is refused outright. This is a lightweight guard, not a
// hardened DNS-rebinding-safe fetch.
const IPV4_LITERAL_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/;

function isIpLiteralHost(hostname: string): boolean {
  const bare = hostname.replace(/^\[/, "").replace(/\]$/, "");
  return IPV4_LITERAL_PATTERN.test(bare) || bare.includes(":");
}

export class ShortLinkResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShortLinkResolutionError";
  }
}

/**
 * Resolves a t.co short link to its final destination by manually following
 * redirects (rather than a bare `fetch(url, {redirect:"follow"})`), so each
 * hop can be validated before it's followed.
 */
export async function resolveShortLink(url: string): Promise<string> {
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    throw new ShortLinkResolutionError("malformed-url");
  }

  if (current.hostname.toLowerCase() !== "t.co") {
    throw new ShortLinkResolutionError("not-a-short-link");
  }

  for (let hop = 0; hop < MAX_REDIRECT_HOPS; hop++) {
    const res = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(REDIRECT_TIMEOUT_MS),
    });

    if (res.status < 300 || res.status >= 400) {
      // Not a redirect: this is the final resolved URL.
      if (ALLOWED_FINAL_HOSTS.has(current.hostname.toLowerCase())) {
        return current.toString();
      }
      throw new ShortLinkResolutionError("unresolved-host");
    }

    const location = res.headers.get("location");
    if (!location) {
      throw new ShortLinkResolutionError("missing-location-header");
    }

    const next = new URL(location, current);
    if (next.protocol !== "https:") {
      throw new ShortLinkResolutionError("non-https-redirect");
    }
    if (isIpLiteralHost(next.hostname)) {
      throw new ShortLinkResolutionError("ip-literal-redirect");
    }

    current = next;
  }

  throw new ShortLinkResolutionError("too-many-redirects");
}

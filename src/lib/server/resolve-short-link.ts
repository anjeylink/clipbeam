const MAX_REDIRECT_HOPS = 5;
const REDIRECT_TIMEOUT_MS = 5000;

/**
 * Which hosts mint a Platform's short/share links, and which hosts a
 * resolved link is allowed to land on.
 */
export interface ShortLinkPolicy {
  sourceHosts: ReadonlySet<string>;
  finalHosts: ReadonlySet<string>;
}

export const X_SHORT_LINK_POLICY: ShortLinkPolicy = {
  sourceHosts: new Set(["t.co"]),
  finalHosts: new Set(["x.com", "twitter.com", "mobile.twitter.com"]),
};

// threads.com/share/<token> links 302 to the canonical /@user/post/<code>.
export const THREADS_SHARE_LINK_POLICY: ShortLinkPolicy = {
  sourceHosts: new Set(["www.threads.com", "threads.com", "www.threads.net", "threads.net"]),
  finalHosts: new Set(["www.threads.com", "threads.com", "www.threads.net", "threads.net"]),
};

// Rejects bare IPv4/IPv6 literals as redirect targets — a short link is
// attacker-influenceable (anyone can get X to mint a t.co pointing anywhere),
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
 * Resolves a short/share link (t.co by default) to its final destination by
 * manually following redirects (rather than a bare
 * `fetch(url, {redirect:"follow"})`), so each hop can be validated before
 * it's followed.
 */
export async function resolveShortLink(
  url: string,
  policy: ShortLinkPolicy = X_SHORT_LINK_POLICY,
): Promise<string> {
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    throw new ShortLinkResolutionError("malformed-url");
  }

  if (!policy.sourceHosts.has(current.hostname.toLowerCase())) {
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
      if (policy.finalHosts.has(current.hostname.toLowerCase())) {
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

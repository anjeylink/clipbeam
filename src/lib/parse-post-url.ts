import type { MediaKind, Platform, VideoQualityOption, ParsedMedia } from "@/lib/media-types";

export type { MediaKind, Platform, VideoQualityOption, ParsedMedia };

// Matches x.com/twitter.com/mobile.twitter.com status links. Scheme is
// optional (people paste bare "x.com/..."), the legacy plural "statuses"
// segment is accepted alongside "status", and there's no trailing anchor so
// query strings, fragments, and /photo/1 or /video/1 suffixes are tolerated.
const DIRECT_STATUS_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\/([\w]{1,15})\/status(?:es)?\/(\d+)/i;

// Matches the handle-less "/i/status/..." and "/i/web/status/..." forms.
const HANDLE_LESS_STATUS_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\/i\/(?:web\/)?status\/(\d+)/i;

// t.co short links can't be resolved to a status id without following a
// server-side redirect, so this only confirms the shape is plausible.
const SHORT_LINK_URL_PATTERN = /^(?:https?:\/\/)?t\.co\/[\w]+/i;

// Matches threads.com (and the legacy threads.net, which redirects there)
// post links in both the "/@user/post/CODE" and handle-less "/t/CODE"
// forms. The shortcode is all the server needs — the author is read from
// the fetched page, since "/t/" links carry no handle and the "@user"
// segment isn't checked by Threads (a wrong one still redirects to the
// real author). No trailing anchor, so ?xmt=..., fragments and a /media
// suffix are tolerated.
const THREADS_POST_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?threads\.(?:com|net)\/(?:@[\w.]{1,30}\/post|t)\/([\w-]+)/i;

// threads.com/share/<token> links (from the app's Share button) carry no
// shortcode; like t.co they can only be resolved by following a server-side
// redirect, so this only confirms the shape is plausible.
const THREADS_SHARE_URL_PATTERN = /^(?:https?:\/\/)?(?:www\.)?threads\.(?:com|net)\/share\/[\w-]+/i;

export type XUrlFormat = "direct" | "short-link" | "invalid";

export interface XUrlValidation {
  valid: boolean;
  format: XUrlFormat;
  handle?: string;
  statusId?: string;
}

/**
 * Format-only validation of an X link, isomorphic (safe on client and
 * server). Does not confirm the post exists or has media — that requires
 * the /api/resolve round trip in parsePostUrl. Also used server-side,
 * re-run against the post-redirect URL once a short link has been resolved.
 */
export function validateXUrl(url: string): XUrlValidation {
  const trimmed = url.trim();

  const directMatch = trimmed.match(DIRECT_STATUS_URL_PATTERN);
  if (directMatch) {
    return { valid: true, format: "direct", handle: directMatch[1], statusId: directMatch[2] };
  }

  const handleLessMatch = trimmed.match(HANDLE_LESS_STATUS_URL_PATTERN);
  if (handleLessMatch) {
    return { valid: true, format: "direct", statusId: handleLessMatch[1] };
  }

  if (SHORT_LINK_URL_PATTERN.test(trimmed)) {
    return { valid: true, format: "short-link" };
  }

  return { valid: false, format: "invalid" };
}

/** Format-only validation of a Threads link; returns its shortcode, or null. */
export function threadsShortcode(url: string): string | null {
  return url.trim().match(THREADS_POST_URL_PATTERN)?.[1] ?? null;
}

export type PostUrlValidation =
  | { valid: true; platform: "x"; x: XUrlValidation }
  | { valid: true; platform: "threads"; format: "direct"; shortcode: string }
  | { valid: true; platform: "threads"; format: "share-link" }
  | { valid: false };

/**
 * Detects the Platform from a pasted link and validates its format. The
 * user never picks a Platform — this is the only place that decides it.
 */
export function validatePostUrl(url: string): PostUrlValidation {
  const x = validateXUrl(url);
  if (x.valid) return { valid: true, platform: "x", x };

  const shortcode = threadsShortcode(url);
  if (shortcode) return { valid: true, platform: "threads", format: "direct", shortcode };

  if (THREADS_SHARE_URL_PATTERN.test(url.trim())) {
    return { valid: true, platform: "threads", format: "share-link" };
  }

  return { valid: false };
}

export type ParsePostUrlErrorCode =
  | "invalid-format"
  | "not-found"
  | "unsupported-post"
  | "no-media"
  | "multi-media-unsupported"
  | "unsupported-media-host"
  | "rate-limited"
  | "unknown";

const PARSE_POST_URL_ERROR_CODES: readonly ParsePostUrlErrorCode[] = [
  "invalid-format",
  "not-found",
  "unsupported-post",
  "no-media",
  "multi-media-unsupported",
  "unsupported-media-host",
  "rate-limited",
  "unknown",
];

export class ParsePostUrlError extends Error {
  readonly code: ParsePostUrlErrorCode;

  constructor(code: ParsePostUrlErrorCode) {
    super(code);
    this.name = "ParsePostUrlError";
    this.code = code;
  }
}

function isParsePostUrlErrorCode(value: unknown): value is ParsePostUrlErrorCode {
  return (
    typeof value === "string" &&
    (PARSE_POST_URL_ERROR_CODES as readonly string[]).includes(value)
  );
}

/**
 * Resolves a pasted post URL to its media via the /api/resolve Route
 * Handler, which does the actual extraction server-side (X's syndication
 * endpoint and Threads' pages both block or strip browser calls). Assumes
 * the URL has already passed validatePostUrl.
 */
export async function parsePostUrl(url: string): Promise<ParsedMedia> {
  const res = await fetch(`/api/resolve?url=${encodeURIComponent(url)}`);

  if (!res.ok) {
    let code: unknown;
    try {
      code = (await res.json())?.code;
    } catch {
      // ignore: non-JSON error body falls through to the "unknown" default
    }
    throw new ParsePostUrlError(isParsePostUrlErrorCode(code) ? code : "unknown");
  }

  return (await res.json()) as ParsedMedia;
}

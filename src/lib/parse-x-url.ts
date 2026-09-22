import type { MediaKind, VideoQualityOption, ParsedXMedia } from "@/lib/x-media-types";

export type { MediaKind, VideoQualityOption, ParsedXMedia };

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

export type XUrlFormat = "direct" | "short-link" | "invalid";

export interface XUrlValidation {
  valid: boolean;
  format: XUrlFormat;
  handle?: string;
  statusId?: string;
}

/**
 * Format-only validation, isomorphic (safe on client and server). Does not
 * confirm the post exists or has media — that requires the /api/resolve
 * round trip in parseXUrl. Also used server-side, re-run against the
 * post-redirect URL once a short link has been resolved.
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

export type ParseXUrlErrorCode =
  | "invalid-format"
  | "not-found"
  | "unsupported-post"
  | "no-media"
  | "multi-media-unsupported"
  | "unsupported-media-host"
  | "rate-limited"
  | "unknown";

export class ParseXUrlError extends Error {
  readonly code: ParseXUrlErrorCode;

  constructor(code: ParseXUrlErrorCode) {
    super(code);
    this.name = "ParseXUrlError";
    this.code = code;
  }
}

function isParseXUrlErrorCode(value: unknown): value is ParseXUrlErrorCode {
  return (
    typeof value === "string" &&
    [
      "invalid-format",
      "not-found",
      "unsupported-post",
      "no-media",
      "multi-media-unsupported",
      "unsupported-media-host",
      "rate-limited",
      "unknown",
    ].includes(value)
  );
}

/**
 * Resolves a pasted X/Twitter post URL to its media via the /api/resolve
 * Route Handler, which does the actual (server-side, since the syndication
 * endpoint's CORS policy blocks browser calls) extraction. Assumes the URL
 * has already passed validateXUrl.
 */
export async function parseXUrl(url: string): Promise<ParsedXMedia> {
  const res = await fetch(`/api/resolve?url=${encodeURIComponent(url)}`);

  if (!res.ok) {
    let code: unknown;
    try {
      code = (await res.json())?.code;
    } catch {
      // ignore: non-JSON error body falls through to the "unknown" default
    }
    throw new ParseXUrlError(isParseXUrlErrorCode(code) ? code : "unknown");
  }

  return (await res.json()) as ParsedXMedia;
}

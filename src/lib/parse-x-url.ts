export type MediaKind = "image" | "video";

export interface VideoQualityOption {
  label: string;
  width: number;
  height: number;
  url: string;
  approxSizeMb: number;
}

export interface ParsedXMedia {
  postUrl: string;
  authorHandle: string;
  kind: MediaKind;
  posterUrl: string;
  imageUrl?: string;
  qualities?: VideoQualityOption[];
}

const X_STATUS_URL_PATTERN =
  /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/([\w]{1,15})\/status\/(\d+)/i;

export interface XUrlValidation {
  valid: boolean;
  handle?: string;
  statusId?: string;
}

/**
 * Format-only validation. Deliberately does not know about "mock failure"
 * content (see parseXUrl) so this stays a faithful stand-in for validating
 * against a real API later.
 */
export function validateXUrl(url: string): XUrlValidation {
  const match = url.trim().match(X_STATUS_URL_PATTERN);
  if (!match) return { valid: false };
  return { valid: true, handle: match[3], statusId: match[4] };
}

export type ParseXUrlErrorCode = "unsupported-post";

export class ParseXUrlError extends Error {
  readonly code: ParseXUrlErrorCode;

  constructor(code: ParseXUrlErrorCode) {
    super(code);
    this.name = "ParseXUrlError";
    this.code = code;
  }
}

const MOCK_NETWORK_DELAY_MIN_MS = 900;
const MOCK_NETWORK_DELAY_MAX_MS = 1400;

function mockDelay(): Promise<void> {
  const ms =
    MOCK_NETWORK_DELAY_MIN_MS +
    Math.random() * (MOCK_NETWORK_DELAY_MAX_MS - MOCK_NETWORK_DELAY_MIN_MS);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stands in for a real fetch/parse call to an X post. Assumes the URL has
 * already passed validateXUrl — this is the single seam to replace with a
 * real Server Action/API route later.
 *
 * Mock behavior: rejects if the handle contains "error" (used to exercise
 * the inline error state); otherwise branches on whether the trailing
 * status id is even (video) or odd (image).
 */
export async function parseXUrl(url: string): Promise<ParsedXMedia> {
  const { handle, statusId } = validateXUrl(url);
  await mockDelay();

  if (handle?.toLowerCase().includes("error")) {
    throw new ParseXUrlError("unsupported-post");
  }

  // Snowflake ids can exceed Number.MAX_SAFE_INTEGER, so branch on the last
  // digit's parity rather than parsing the whole id as a number.
  const lastDigit = Number((statusId ?? "0").slice(-1));
  const isVideo = lastDigit % 2 === 0;

  if (isVideo) {
    const qualities: VideoQualityOption[] = [
      {
        label: "1080p",
        width: 1920,
        height: 1080,
        url: "/mock/sample-video-1080p.mp4",
        approxSizeMb: 4.8,
      },
      {
        label: "720p",
        width: 1280,
        height: 720,
        url: "/mock/sample-video-720p.mp4",
        approxSizeMb: 2.6,
      },
      {
        label: "480p",
        width: 854,
        height: 480,
        url: "/mock/sample-video-480p.mp4",
        approxSizeMb: 1.3,
      },
    ];
    return {
      postUrl: url,
      authorHandle: handle ?? "unknown",
      kind: "video",
      posterUrl: "/mock/sample-video-poster.jpg",
      qualities,
    };
  }

  return {
    postUrl: url,
    authorHandle: handle ?? "unknown",
    kind: "image",
    posterUrl: "/mock/sample-image.jpg",
    imageUrl: "/mock/sample-image.jpg",
  };
}

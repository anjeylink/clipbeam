import type { ResolvedMedia, ResolvedVideoQuality } from "@/lib/server/resolved-media";
import type { ParseXUrlErrorCode } from "@/lib/parse-x-url";

export class TweetResolutionError extends Error {
  readonly code: Extract<
    ParseXUrlErrorCode,
    "unsupported-post" | "no-media" | "multi-media-unsupported" | "unsupported-media-host"
  >;

  constructor(code: TweetResolutionError["code"]) {
    super(code);
    this.name = "TweetResolutionError";
    this.code = code;
  }
}

interface SyndicationVideoVariant {
  content_type: string;
  url: string;
  bitrate?: number;
}

interface SyndicationMediaDetail {
  type: "photo" | "video" | "animated_gif";
  media_url_https: string;
  original_info?: { width?: number; height?: number };
  video_info?: {
    duration_millis?: number;
    variants: SyndicationVideoVariant[];
  };
}

interface SyndicationTweet {
  __typename?: string;
  user?: { screen_name?: string };
  mediaDetails?: SyndicationMediaDetail[];
}

const RESOLUTION_PATTERN = /(\d+)x(\d+)/;

// Labels by the short edge, not the literal "height" field — a portrait
// (vertical) video's variant URL still encodes WxH as width<height (e.g.
// 720x1280), and labeling that "1280p" reads wrong to users used to
// 720p/480p/etc. referring to the shorter edge regardless of orientation.
function labelForDimensions(width: number, height: number): string {
  return `${Math.min(width, height)}p`;
}

function buildVideoQualities(detail: SyndicationMediaDetail): ResolvedVideoQuality[] {
  const durationMs = detail.video_info?.duration_millis ?? 0;
  const variants = detail.video_info?.variants ?? [];

  return variants
    .filter((variant) => variant.content_type === "video/mp4")
    .map((variant, index): ResolvedVideoQuality => {
      // Resolution is usually encoded in the variant URL path (.../vid/WxH/...),
      // but animated_gif mp4 variants (e.g. .../tweet_video/...) often lack it —
      // fall back to the media detail's overall dimensions, then to an
      // index-based label so the variant is never silently dropped.
      const match = variant.url.match(RESOLUTION_PATTERN);
      const width = match ? Number(match[1]) : (detail.original_info?.width ?? 0);
      const height = match ? Number(match[2]) : (detail.original_info?.height ?? 0);
      const bitrate = variant.bitrate ?? 0;
      // bitrate (bits/sec) * duration (ms) / 8 (bits->bytes) / 1e6 (bytes->MB) / 1e3 (ms->s)
      const approxSizeMb = (bitrate * durationMs) / 8e9;
      return {
        label:
          width > 0 && height > 0 ? labelForDimensions(width, height) : `Quality ${index + 1}`,
        width,
        height,
        url: variant.url,
        approxSizeMb,
      };
    })
    .sort((a, b) => b.width - a.width);
}

/**
 * Maps a raw JSON response from the syndication endpoint to our internal
 * ResolvedMedia shape. Pure/no I/O — throws TweetResolutionError for
 * unavailable/tombstoned posts, posts with no media, or multi-photo posts
 * (out of scope for this pass). Animated GIFs are treated identically to
 * videos: X delivers them as an mp4 entry in video_info.variants, so they
 * flow through the same mapping as a regular video at no extra cost.
 */
export function mapTweetJsonToMedia(tweet: unknown, postUrl: string): ResolvedMedia {
  const parsed = tweet as SyndicationTweet;

  if (parsed?.__typename === "TweetTombstone") {
    throw new TweetResolutionError("unsupported-post");
  }

  const authorHandle = parsed?.user?.screen_name;
  if (!authorHandle) {
    throw new TweetResolutionError("unsupported-post");
  }

  const mediaDetails = parsed.mediaDetails ?? [];
  if (mediaDetails.length === 0) {
    throw new TweetResolutionError("no-media");
  }
  if (mediaDetails.length > 1) {
    throw new TweetResolutionError("multi-media-unsupported");
  }

  const detail = mediaDetails[0];

  if (detail.type === "photo") {
    return {
      postUrl,
      authorHandle,
      kind: "image",
      posterUrl: detail.media_url_https,
      imageUrl: detail.media_url_https,
    };
  }

  // "video" and "animated_gif" both carry an mp4 in video_info.variants.
  const qualities = buildVideoQualities(detail);
  if (qualities.length === 0) {
    throw new TweetResolutionError("no-media");
  }

  return {
    postUrl,
    authorHandle,
    kind: "video",
    posterUrl: detail.media_url_https,
    qualities,
  };
}

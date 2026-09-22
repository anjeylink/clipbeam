import type { ResolvedMedia } from "@/lib/server/resolved-media";
import type { ParsedXMedia, VideoQualityOption } from "@/lib/x-media-types";
import { isProxyableMediaUrl } from "@/lib/server/media-proxy";
import { mediaProxyUrl } from "@/lib/server/media-proxy-url";
import { TweetResolutionError } from "@/lib/server/map-tweet-to-media";

/**
 * The only place that turns a ResolvedMedia (raw upstream URLs) into the
 * ParsedXMedia the client receives. Reuses the exact allowlist /api/download
 * enforces, so a URL that would 403/400 later is rejected here instead —
 * the two can't silently drift apart. Called last in resolve/route.ts, after
 * enrichVideoQualitySizes has already probed the raw URLs.
 */
export function toClientMedia(media: ResolvedMedia): ParsedXMedia {
  if (media.kind === "image") {
    const rawUrl = media.imageUrl;
    if (!rawUrl || !isProxyableMediaUrl(rawUrl)) {
      throw new TweetResolutionError("unsupported-media-host");
    }
    return {
      kind: "image",
      postUrl: media.postUrl,
      authorHandle: media.authorHandle,
      posterUrl: media.posterUrl,
      previewUrl: rawUrl,
      proxiedUrl: mediaProxyUrl(rawUrl),
    };
  }

  const qualities: VideoQualityOption[] = (media.qualities ?? []).map((quality) => {
    if (!isProxyableMediaUrl(quality.url)) {
      throw new TweetResolutionError("unsupported-media-host");
    }
    return {
      label: quality.label,
      width: quality.width,
      height: quality.height,
      approxSizeMb: quality.approxSizeMb,
      proxiedUrl: mediaProxyUrl(quality.url),
    };
  });

  return {
    kind: "video",
    postUrl: media.postUrl,
    authorHandle: media.authorHandle,
    posterUrl: media.posterUrl,
    qualities,
  };
}

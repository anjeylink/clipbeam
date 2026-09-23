import type { ResolvedMedia } from "@/lib/server/resolved-media";
import type { ParsedMedia, VideoQualityOption } from "@/lib/media-types";
import { isProxyableMediaUrl } from "@/lib/server/media-proxy";
import { mediaProxyUrl } from "@/lib/server/media-proxy-url";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";

// X's pbs.twimg.com allows hotlinking, so X image previews and posters skip
// our proxy. Threads URLs are signed, expire, and may redirect on a foreign
// Referer, so everything from Threads is proxied.
function hotlinkOrProxy(media: ResolvedMedia, rawUrl: string): string {
  return media.platform === "x" ? rawUrl : mediaProxyUrl(rawUrl);
}

function assertProxyable(media: ResolvedMedia, rawUrl: string): void {
  if (!isProxyableMediaUrl(rawUrl, media.platform)) {
    throw new MediaResolutionError("unsupported-media-host");
  }
}

/**
 * The only place that turns a ResolvedMedia (raw upstream URLs) into the
 * ParsedMedia the client receives. Reuses the exact allowlist /api/download
 * enforces, checked against the post's own Platform, so a URL that would
 * 403/400 later is rejected here instead — the two can't silently drift
 * apart. Called last in resolve/route.ts, after enrichVideoQualitySizes has
 * already probed the raw URLs.
 */
export function toClientMedia(media: ResolvedMedia): ParsedMedia {
  if (media.kind === "image") {
    const rawUrl = media.imageUrl;
    if (!rawUrl) {
      throw new MediaResolutionError("unsupported-media-host");
    }
    assertProxyable(media, rawUrl);
    return {
      platform: media.platform,
      kind: "image",
      postUrl: media.postUrl,
      authorHandle: media.authorHandle,
      previewUrl: hotlinkOrProxy(media, rawUrl),
      proxiedUrl: mediaProxyUrl(rawUrl),
    };
  }

  const qualities: VideoQualityOption[] = (media.qualities ?? []).map((quality) => {
    assertProxyable(media, quality.url);
    return {
      label: quality.label,
      width: quality.width,
      height: quality.height,
      approxSizeMb: quality.approxSizeMb,
      proxiedUrl: mediaProxyUrl(quality.url),
    };
  });

  let posterUrl: string | undefined;
  if (media.posterUrl) {
    assertProxyable(media, media.posterUrl);
    posterUrl = hotlinkOrProxy(media, media.posterUrl);
  }

  return {
    platform: media.platform,
    kind: "video",
    postUrl: media.postUrl,
    authorHandle: media.authorHandle,
    posterUrl,
    qualities,
  };
}

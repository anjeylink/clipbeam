import type { Platform, ResolvedMedia, ResolvedMediaItem } from "@/lib/server/resolved-media";
import type { MediaItem, ParsedMedia } from "@/lib/media-types";
import { isProxyableMediaUrl } from "@/lib/server/media-proxy";
import { mediaProxyUrl } from "@/lib/server/media-proxy-url";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";

// X's pbs.twimg.com allows hotlinking, so X image previews and posters skip
// our proxy. Instagram and Threads URLs are signed, expire, and may redirect
// on a foreign Referer, so everything from them is proxied.
function hotlinkOrProxy(platform: Platform, rawUrl: string): string {
  return platform === "x" ? rawUrl : mediaProxyUrl(rawUrl);
}

function assertProxyable(platform: Platform, rawUrl: string): void {
  if (!isProxyableMediaUrl(rawUrl, platform)) {
    throw new MediaResolutionError("unsupported-media-host");
  }
}

function toClientItem(platform: Platform, item: ResolvedMediaItem): MediaItem {
  if (item.kind === "image") {
    assertProxyable(platform, item.imageUrl);
    return {
      kind: "image",
      previewUrl: hotlinkOrProxy(platform, item.imageUrl),
      proxiedUrl: mediaProxyUrl(item.imageUrl),
    };
  }

  const qualities = item.qualities.map((quality) => {
    assertProxyable(platform, quality.url);
    return {
      label: quality.label,
      width: quality.width,
      height: quality.height,
      approxSizeMb: quality.approxSizeMb,
      proxiedUrl: mediaProxyUrl(quality.url),
    };
  });

  let posterUrl: string | undefined;
  if (item.posterUrl) {
    assertProxyable(platform, item.posterUrl);
    posterUrl = hotlinkOrProxy(platform, item.posterUrl);
  }

  return { kind: "video", posterUrl, qualities };
}

/**
 * The only place that turns a ResolvedMedia (raw upstream URLs) into the
 * ParsedMedia the client receives. Reuses the exact allowlist /api/download
 * enforces, checked against the post's own Platform, so a URL that would
 * 403/400 later is rejected here instead — the two can't silently drift
 * apart. One item off the allowlist rejects the whole Post. Called last in
 * resolve/route.ts, after enrichVideoQualitySizes has already probed the raw
 * URLs.
 */
export function toClientMedia(media: ResolvedMedia): ParsedMedia {
  if (media.items.length === 0) {
    throw new MediaResolutionError("no-media");
  }
  return {
    platform: media.platform,
    postUrl: media.postUrl,
    authorHandle: media.authorHandle,
    items: media.items.map((item) => toClientItem(media.platform, item)),
  };
}

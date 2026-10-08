import type { ResolvedMedia, ResolvedMediaItem } from "@/lib/server/resolved-media";

const HEAD_TIMEOUT_MS = 3000;

async function fetchContentLengthMb(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(HEAD_TIMEOUT_MS) });
    if (!res.ok) return null;
    const contentLength = Number(res.headers.get("content-length"));
    return Number.isFinite(contentLength) && contentLength > 0 ? contentLength / 1e6 : null;
  } catch {
    return null;
  }
}

async function enrichItem(item: ResolvedMediaItem): Promise<ResolvedMediaItem> {
  if (item.kind !== "video") return item;

  const qualities = await Promise.all(
    item.qualities.map(async (quality) => {
      if (quality.approxSizeMb > 0) return quality;
      const approxSizeMb = await fetchContentLengthMb(quality.url);
      return approxSizeMb === null ? quality : { ...quality, approxSizeMb };
    }),
  );

  return { ...item, qualities };
}

/**
 * The syndication endpoint's per-variant `bitrate` is sometimes missing, in
 * which case buildVideoQualities' bitrate * duration estimate collapses to
 * 0. Where that happens, probe the CDN directly for a real Content-Length
 * so the quality picker never shows a bogus "0 MB" option. Left as a
 * post-processing pass over mapTweetJsonToMedia's output (rather than baked
 * into it) so that mapping stays pure and synchronously testable. A
 * carousel's videos are probed in parallel, so it costs no more time than
 * one.
 */
export async function enrichVideoQualitySizes(media: ResolvedMedia): Promise<ResolvedMedia> {
  if (media.items.every((item) => item.kind !== "video")) return media;
  return { ...media, items: await Promise.all(media.items.map(enrichItem)) };
}

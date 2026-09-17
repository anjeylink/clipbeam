import type { ParsedXMedia } from "@/lib/x-media-types";

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

/**
 * The syndication endpoint's per-variant `bitrate` is sometimes missing, in
 * which case buildVideoQualities' bitrate * duration estimate collapses to
 * 0. Where that happens, probe the CDN directly for a real Content-Length
 * so the quality picker never shows a bogus "0 MB" option. Left as a
 * post-processing pass over mapTweetJsonToMedia's output (rather than baked
 * into it) so that mapping stays pure and synchronously testable.
 */
export async function enrichVideoQualitySizes(media: ParsedXMedia): Promise<ParsedXMedia> {
  if (media.kind !== "video" || !media.qualities) return media;

  const qualities = await Promise.all(
    media.qualities.map(async (quality) => {
      if (quality.approxSizeMb > 0) return quality;
      const approxSizeMb = await fetchContentLengthMb(quality.url);
      return approxSizeMb === null ? quality : { ...quality, approxSizeMb };
    }),
  );

  return { ...media, qualities };
}

import type { XUrlValidation } from "@/lib/parse-post-url";
import { validateXUrl } from "@/lib/parse-post-url";
import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { computeSyndicationToken } from "@/lib/server/twitter-token";
import { mapTweetJsonToMedia } from "@/lib/server/map-tweet-to-media";
import { resolveShortLink, ShortLinkResolutionError } from "@/lib/server/resolve-short-link";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";

/**
 * Resolves an X post (direct or t.co link, already format-validated) to its
 * ResolvedMedia via Twitter's unauthenticated syndication endpoint. Throws
 * MediaResolutionError for every failure the client should see.
 */
export async function resolveXPost(url: string, validation: XUrlValidation): Promise<ResolvedMedia> {
  let resolvedUrl = url;
  let current = validation;

  if (current.format === "short-link") {
    try {
      resolvedUrl = await resolveShortLink(resolvedUrl);
    } catch (err) {
      throw new MediaResolutionError(
        err instanceof ShortLinkResolutionError ? "invalid-format" : "unknown",
      );
    }
    current = validateXUrl(resolvedUrl);
    if (!current.valid || current.format !== "direct") {
      throw new MediaResolutionError("invalid-format");
    }
  }

  const statusId = current.statusId;
  if (!statusId) {
    throw new MediaResolutionError("invalid-format");
  }

  const token = computeSyndicationToken(statusId);
  const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${statusId}&token=${token}`;

  let res: Response;
  try {
    res = await fetch(syndicationUrl, { next: { revalidate: 300 } });
  } catch {
    throw new MediaResolutionError("unknown");
  }

  if (res.status === 404) throw new MediaResolutionError("not-found");
  if (res.status === 429) throw new MediaResolutionError("rate-limited");
  if (!res.ok) throw new MediaResolutionError("unknown");

  let tweetJson: unknown;
  try {
    tweetJson = await res.json();
  } catch {
    throw new MediaResolutionError("unknown");
  }

  return mapTweetJsonToMedia(tweetJson, resolvedUrl);
}

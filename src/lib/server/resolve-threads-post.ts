import { threadsShortcode, type PostUrlValidation } from "@/lib/parse-post-url";
import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { mapThreadsEmbedToMedia } from "@/lib/server/map-threads-embed";
import { mapThreadsPageToMedia } from "@/lib/server/map-threads-page";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import {
  resolveShortLink,
  ShortLinkResolutionError,
  THREADS_SHARE_LINK_POLICY,
} from "@/lib/server/resolve-short-link";

// See docs/adr/0001-threads-extraction-via-embed.md. The embed serves its
// media markup to any non-browser User-Agent (a browser UA gets an empty JS
// shell), so we identify ourselves honestly there. The full post page only
// server-renders its JSON for crawlers, hence the Googlebot UA on the
// fallback alone.
const EMBED_USER_AGENT = "ClipBeam/1.0";
const PAGE_USER_AGENT = "Googlebot/2.1 (+http://www.google.com/bot.html)";
const FETCH_TIMEOUT_MS = 8000;

async function fetchThreadsHtml(url: string, userAgent: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 300 },
    });
  } catch {
    throw new MediaResolutionError("unknown");
  }

  if (res.status === 404) throw new MediaResolutionError("not-found");
  // Threads answers throttled scrapers with 403 rather than 429.
  if (res.status === 403 || res.status === 429) throw new MediaResolutionError("rate-limited");
  if (!res.ok) throw new MediaResolutionError("unknown");

  return res.text();
}

// A share link (threads.com/share/<token>) 302s to the canonical post URL;
// an unknown token just 200s on the share page itself, so it never yields
// a shortcode.
async function shortcodeFromShareLink(url: string): Promise<string> {
  let resolvedUrl: string;
  try {
    resolvedUrl = await resolveShortLink(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
      THREADS_SHARE_LINK_POLICY,
    );
  } catch (err) {
    throw new MediaResolutionError(
      err instanceof ShortLinkResolutionError ? "invalid-format" : "unknown",
    );
  }
  const shortcode = threadsShortcode(resolvedUrl);
  if (!shortcode) throw new MediaResolutionError("not-found");
  return shortcode;
}

/**
 * Resolves a Threads post link (already format-validated) to its
 * ResolvedMedia: share links are first followed to the canonical post URL,
 * then the lightweight embed page is tried, falling back to the full post
 * page's server-rendered JSON only when the embed is inconclusive.
 */
export async function resolveThreadsPost(
  url: string,
  validation: Extract<PostUrlValidation, { platform: "threads" }>,
): Promise<ResolvedMedia> {
  const shortcode =
    validation.format === "share-link" ? await shortcodeFromShareLink(url) : validation.shortcode;
  const encoded = encodeURIComponent(shortcode);

  const embedHtml = await fetchThreadsHtml(
    `https://www.threads.com/t/${encoded}/embed`,
    EMBED_USER_AGENT,
  );
  const fromEmbed = mapThreadsEmbedToMedia(embedHtml, shortcode);
  if (fromEmbed) return fromEmbed;

  const pageHtml = await fetchThreadsHtml(`https://www.threads.com/t/${encoded}`, PAGE_USER_AGENT);
  return mapThreadsPageToMedia(pageHtml, shortcode);
}

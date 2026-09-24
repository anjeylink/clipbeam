import { instagramShortcode, type PostUrlValidation } from "@/lib/parse-post-url";
import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { mapInstagramEmbedToMedia } from "@/lib/server/map-instagram-embed";
import { mapInstagramPageToMedia } from "@/lib/server/map-instagram-page";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import {
  INSTAGRAM_SHARE_LINK_POLICY,
  resolveShortLink,
  ShortLinkResolutionError,
} from "@/lib/server/resolve-short-link";

// See docs/adr/0004-instagram-extraction-via-embed.md. Same split as
// Threads: the embed is fetched under our own name, and only the full post
// page, which server-renders its JSON for crawlers, gets the Googlebot UA.
const EMBED_USER_AGENT = "ClipBeam/1.0";
const PAGE_USER_AGENT = "Googlebot/2.1 (+http://www.google.com/bot.html)";
const FETCH_TIMEOUT_MS = 8000;
// Where Instagram sends a logged-out visitor it's throttling.
const LOGIN_PATH = "/accounts/login";

async function fetchInstagramHtml(url: string, userAgent: string): Promise<string> {
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
  if (res.status === 403 || res.status === 429) throw new MediaResolutionError("rate-limited");
  if (!res.ok) throw new MediaResolutionError("unknown");
  if (res.url?.includes(LOGIN_PATH)) throw new MediaResolutionError("rate-limited");

  return res.text();
}

// A share link (instagram.com/share/[reel/]<token>) redirects to the
// canonical post URL; an unknown token just 200s on the share page itself,
// so it never yields a shortcode.
async function shortcodeFromShareLink(url: string): Promise<string> {
  let resolvedUrl: string;
  try {
    resolvedUrl = await resolveShortLink(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
      INSTAGRAM_SHARE_LINK_POLICY,
    );
  } catch (err) {
    throw new MediaResolutionError(
      err instanceof ShortLinkResolutionError ? "invalid-format" : "unknown",
    );
  }
  const shortcode = instagramShortcode(resolvedUrl);
  if (!shortcode) throw new MediaResolutionError("not-found");
  return shortcode;
}

/**
 * Resolves an Instagram post link (already format-validated) to its
 * ResolvedMedia: share links are first followed to the canonical post URL,
 * then the embed page is tried, falling back to the full post page's
 * server-rendered JSON only when the embed is inconclusive.
 */
export async function resolveInstagramPost(
  url: string,
  validation: Extract<PostUrlValidation, { platform: "instagram" }>,
): Promise<ResolvedMedia> {
  const shortcode =
    validation.format === "share-link" ? await shortcodeFromShareLink(url) : validation.shortcode;
  const encoded = encodeURIComponent(shortcode);

  const embedHtml = await fetchInstagramHtml(
    `https://www.instagram.com/p/${encoded}/embed/captioned/`,
    EMBED_USER_AGENT,
  );
  const fromEmbed = mapInstagramEmbedToMedia(embedHtml, shortcode);
  if (fromEmbed) return fromEmbed;

  const pageHtml = await fetchInstagramHtml(
    `https://www.instagram.com/p/${encoded}/`,
    PAGE_USER_AGENT,
  );
  return mapInstagramPageToMedia(pageHtml, shortcode);
}

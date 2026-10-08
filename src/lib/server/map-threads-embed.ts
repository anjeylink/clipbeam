import type { ResolvedMedia, ResolvedMediaItem } from "@/lib/server/resolved-media";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import { decodeHtmlEntities } from "@/lib/server/html-entities";

// The embed renders a reply's parent post(s) as plain "OuterContainer"
// context blocks; the post that was actually requested is the last one
// marked "OuterContainerFull" — except that a quoted post is rendered as
// another "OuterContainerFull" block (flagged "OuterContainerQuotePost")
// nested inside it, which must never be mistaken for the target.
const FULL_POST_CLASS_PATTERN = /class="(OuterContainer OuterContainerFull[^"]*)"/g;
const QUOTE_POST_CLASS = "OuterContainerQuotePost";
// Where the target's quoted post starts; nothing after it belongs to the
// target, so its media and author are cut off before we look.
const QUOTE_CONTAINER_MARKER = 'class="QuotePostContainer"';
// Everything from the first media wrapper on (SoloMediaContainer for one
// item, MediaScrollContainer for a carousel): skips the author avatar <img>
// in the header, which is not the post's media.
const MEDIA_SECTION_PATTERN = /class="[^"]*Media(?:Scroll)?Container/;
const CAROUSEL_MARKER = "MediaScrollContainer";
const HANDLE_PATTERN = /class="HeaderLink"[^>]*>\s*<span>([^<]+)<\/span>/;
// A video's <source> (group 1) or an image (group 2), in document order,
// which is the carousel's order.
const MEDIA_PATTERN = /<video\b[^>]*>\s*<source\b[^>]*\bsrc="([^"]+)"|<img\b[^>]*\bsrc="([^"]+)"/g;

export function threadsPostUrl(handle: string, shortcode: string): string {
  return `https://www.threads.com/@${handle}/post/${shortcode}`;
}

/**
 * Maps a Threads embed page (`/t/<shortcode>/embed`) to ResolvedMedia, one
 * item per carousel entry. Pure/no I/O. Throws MediaResolutionError when
 * the embed is conclusive (post unavailable → not-found) and returns null
 * when it isn't — no media of its own found (a text post,
 * including one that only quotes a media post, or markup we don't
 * recognise), or several media elements without the carousel wrapper — so
 * the caller can fall back to the full post page.
 */
export function mapThreadsEmbedToMedia(html: string, shortcode: string): ResolvedMedia | null {
  if (html.includes('class="EmbedError"')) {
    throw new MediaResolutionError("not-found");
  }

  let targetStart = -1;
  for (const match of html.matchAll(FULL_POST_CLASS_PATTERN)) {
    if (!match[1].includes(QUOTE_POST_CLASS)) targetStart = match.index;
  }
  if (targetStart === -1) return null;
  let target = html.slice(targetStart);
  const quoteStart = target.indexOf(QUOTE_CONTAINER_MARKER);
  if (quoteStart !== -1) target = target.slice(0, quoteStart);

  const handleMatch = target.match(HANDLE_PATTERN);
  if (!handleMatch) return null;
  const authorHandle = decodeHtmlEntities(handleMatch[1].trim());

  const mediaStart = target.search(MEDIA_SECTION_PATTERN);
  if (mediaStart === -1) return null;
  const mediaSection = target.slice(mediaStart);

  const items = [...mediaSection.matchAll(MEDIA_PATTERN)].map(
    ([, videoUrl, imageUrl]): ResolvedMediaItem =>
      videoUrl
        ? {
            kind: "video",
            // The embed carries no dimensions, bitrate or poster: a null
            // label renders as "Original", and enrichVideoQualitySizes
            // fills in the size.
            qualities: [
              { label: null, width: 0, height: 0, url: decodeHtmlEntities(videoUrl), approxSizeMb: 0 },
            ],
          }
        : { kind: "image", imageUrl: decodeHtmlEntities(imageUrl) },
  );

  if (items.length === 0) return null;
  if (items.length > 1 && !mediaSection.includes(CAROUSEL_MARKER)) return null;

  return {
    platform: "threads",
    postUrl: threadsPostUrl(authorHandle, shortcode),
    authorHandle,
    items,
  };
}

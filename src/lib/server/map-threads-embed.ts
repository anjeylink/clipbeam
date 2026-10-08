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
// Where the target's quoted post starts: everything before it is the
// target's own author and media.
const QUOTE_CONTAINER_MARKER = 'class="QuotePostContainer"';
// The quoted post ends with its own action bar; whatever follows belongs to
// the target again.
const ACTION_BAR_MARKER = 'class="ActionBarContainer"';
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

function readHandle(block: string): string | null {
  const match = block.match(HANDLE_PATTERN);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

// The media of one post block in document order: empty when it has none,
// null when it can't be trusted (several media elements without the
// carousel wrapper).
function readItems(block: string): ResolvedMediaItem[] | null {
  const mediaStart = block.search(MEDIA_SECTION_PATTERN);
  if (mediaStart === -1) return [];
  const mediaSection = block.slice(mediaStart);

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

  if (items.length > 1 && !mediaSection.includes(CAROUSEL_MARKER)) return null;
  return items;
}

/**
 * Maps a Threads embed page (`/t/<shortcode>/embed`) to ResolvedMedia, one
 * item per carousel entry. Pure/no I/O. A Quote Post with no media of its
 * own maps to the quoted post's media, credited to the quoted post's author
 * (see docs/adr/0005-quote-post-media-fallback.md). Throws
 * MediaResolutionError when the embed is conclusive (post unavailable →
 * not-found) and returns null when it isn't — no media found (a text post,
 * or markup we don't recognise), or several media elements without the
 * carousel wrapper — so the caller can fall back to the full post page.
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
  const target = html.slice(targetStart);
  const quoteStart = target.indexOf(QUOTE_CONTAINER_MARKER);
  const own = quoteStart === -1 ? target : target.slice(0, quoteStart);

  const ownHandle = readHandle(own);
  if (!ownHandle) return null;
  const postUrl = threadsPostUrl(ownHandle, shortcode);

  const ownItems = readItems(own);
  if (!ownItems) return null;
  if (ownItems.length > 0) {
    return { platform: "threads", postUrl, authorHandle: ownHandle, items: ownItems };
  }

  if (quoteStart === -1) return null;
  const quoteEnd = target.indexOf(ACTION_BAR_MARKER, quoteStart);
  if (quoteEnd === -1) return null;
  const quote = target.slice(quoteStart, quoteEnd);
  const quotedHandle = readHandle(quote);
  const quotedItems = readItems(quote);
  if (!quotedHandle || !quotedItems || quotedItems.length === 0) return null;
  // Media past the quoted post would be the target's own, which outranks
  // the quote; the page fallback tells the two apart reliably.
  const trailingItems = readItems(target.slice(quoteEnd));
  if (trailingItems === null || trailingItems.length > 0) return null;

  return { platform: "threads", postUrl, authorHandle: quotedHandle, items: quotedItems };
}

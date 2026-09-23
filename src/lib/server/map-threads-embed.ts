import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";

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
const VIDEO_SOURCE_PATTERN = /<video\b[^>]*>\s*<source\b[^>]*\bsrc="([^"]+)"/g;
const IMAGE_PATTERN = /<img\b[^>]*\bsrc="([^"]+)"/g;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body[0] === "#") {
      const codePoint =
        body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });
}

export function threadsPostUrl(handle: string, shortcode: string): string {
  return `https://www.threads.com/@${handle}/post/${shortcode}`;
}

/**
 * Maps a Threads embed page (`/t/<shortcode>/embed`) to ResolvedMedia.
 * Pure/no I/O. Throws MediaResolutionError when the embed is conclusive
 * (post unavailable → not-found, carousel → multi-media-unsupported) and
 * returns null when it isn't — no media of its own found (a text post,
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

  const videoUrls = [...mediaSection.matchAll(VIDEO_SOURCE_PATTERN)].map((m) =>
    decodeHtmlEntities(m[1]),
  );
  const imageUrls = [...mediaSection.matchAll(IMAGE_PATTERN)].map((m) => decodeHtmlEntities(m[1]));
  const mediaCount = videoUrls.length + imageUrls.length;

  if (mediaCount === 0) return null;
  if (mediaCount > 1) {
    if (mediaSection.includes(CAROUSEL_MARKER)) {
      throw new MediaResolutionError("multi-media-unsupported");
    }
    return null;
  }

  const postUrl = threadsPostUrl(authorHandle, shortcode);

  if (videoUrls.length === 1) {
    return {
      platform: "threads",
      postUrl,
      authorHandle,
      kind: "video",
      // The embed carries no dimensions or bitrate: a null label renders as
      // "Original", and enrichVideoQualitySizes fills in the size.
      qualities: [{ label: null, width: 0, height: 0, url: videoUrls[0], approxSizeMb: 0 }],
    };
  }

  return {
    platform: "threads",
    postUrl,
    authorHandle,
    kind: "image",
    imageUrl: imageUrls[0],
  };
}

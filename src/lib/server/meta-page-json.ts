import type { Platform, ResolvedMedia, ResolvedMediaItem } from "@/lib/server/resolved-media";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import { labelForDimensions } from "@/lib/server/video-quality-label";

// Threads and Instagram post pages, fetched with a crawler User-Agent, both
// server-render their data as `data-sjs` JSON blocks, and both describe a
// post with the same Meta media shape — so one reader serves both.
const SJS_SCRIPT_PATTERN =
  /<script\b[^>]*type="application\/json"[^>]*\bdata-sjs\b[^>]*>([\s\S]*?)<\/script>/g;

// Meta's media_type values.
const MEDIA_TYPE_IMAGE = 1;
const MEDIA_TYPE_VIDEO = 2;
const MEDIA_TYPE_CAROUSEL = 8;

interface MetaImageCandidate {
  width?: number;
  height?: number;
  url: string;
}

// The media fields a post and each item of its carousel have in common.
interface MetaMedia {
  // Threads leaves this null on carousel items.
  media_type?: number | null;
  original_width?: number;
  original_height?: number;
  video_versions?: { url: string }[] | null;
  image_versions2?: { candidates?: MetaImageCandidate[] } | null;
}

export interface MetaPost extends MetaMedia {
  code: string;
  media_type: number;
  user?: { username?: string };
  carousel_media?: MetaMedia[] | null;
  // Threads only: a text post whose only content is a link to an Instagram
  // post carries that post's media here — it's what Threads plays inline in
  // place of a plain link card.
  text_post_app_info?: { linked_inline_media?: MetaPost | null } | null;
}

export interface FindMetaPostOptions {
  // Only accept an object that carries media fields. Instagram's page repeats
  // the post in the author's timeline as a thumbnail-only node (same code
  // and media_type, just a 640px display_uri), which must never be picked.
  requireMedia?: boolean;
}

function isMetaPost(
  value: unknown,
  shortcode: string,
  { requireMedia = false }: FindMetaPostOptions,
): value is MetaPost {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<MetaPost>;
  if (candidate.code !== shortcode || typeof candidate.media_type !== "number") return false;
  return (
    !requireMedia ||
    "image_versions2" in candidate ||
    "video_versions" in candidate ||
    "carousel_media" in candidate
  );
}

// Depth-first search across one block of server-rendered JSON. The page also
// embeds other posts (replies, quoted posts, the author's timeline) — some
// with media of their own — so only an object whose `code` is the requested
// shortcode counts.
function findInJson(root: unknown, shortcode: string, options: FindMetaPostOptions): MetaPost | null {
  const stack: unknown[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (isMetaPost(node, shortcode, options)) return node;
    if (Array.isArray(node)) {
      stack.push(...node);
    } else if (typeof node === "object" && node !== null) {
      stack.push(...Object.values(node));
    }
  }
  return null;
}

/** The post object for `shortcode` in a crawler-UA page's data-sjs JSON, or null. */
export function findMetaPost(
  html: string,
  shortcode: string,
  options: FindMetaPostOptions = {},
): MetaPost | null {
  for (const match of html.matchAll(SJS_SCRIPT_PATTERN)) {
    let json: unknown;
    try {
      json = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const post = findInJson(json, shortcode, options);
    if (post) return post;
  }
  return null;
}

// Instagram's candidates carry no width, in which case the first (largest)
// one wins — the sort is stable.
function largestImage(media: MetaMedia): MetaImageCandidate | undefined {
  const candidates = media.image_versions2?.candidates ?? [];
  return [...candidates].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
}

function mapVideo(media: MetaMedia): ResolvedMediaItem | null {
  const videoUrl = media.video_versions?.[0]?.url;
  if (!videoUrl) return null;
  const width = media.original_width ?? 0;
  const height = media.original_height ?? 0;
  return {
    kind: "video",
    posterUrl: largestImage(media)?.url,
    qualities: [
      {
        label: width > 0 && height > 0 ? labelForDimensions(width, height) : null,
        width,
        height,
        url: videoUrl,
        approxSizeMb: 0,
      },
    ],
  };
}

function mapImage(media: MetaMedia): ResolvedMediaItem | null {
  const imageUrl = largestImage(media)?.url;
  return imageUrl ? { kind: "image", imageUrl } : null;
}

// A carousel item is a video when it has one: Threads gives its items no
// media_type, and a video also carries image candidates (its poster).
function mapCarouselItem(media: MetaMedia): ResolvedMediaItem | null {
  return mapVideo(media) ?? mapImage(media);
}

function mapMetaPostItems(post: MetaPost): ResolvedMediaItem[] | null {
  switch (post.media_type) {
    case MEDIA_TYPE_CAROUSEL:
      return (post.carousel_media ?? []).map(mapCarouselItem).filter((item) => item !== null);
    case MEDIA_TYPE_VIDEO:
      return [mapVideo(post)].filter((item) => item !== null);
    case MEDIA_TYPE_IMAGE:
      return [mapImage(post)].filter((item) => item !== null);
    default:
      return null;
  }
}

/**
 * Maps a post's own media to ResolvedMedia, one item per carousel entry, or
 * returns null when it has none (a text post, or a media_type we don't
 * recognise). Throws no-media for a media post none of whose media can be
 * read.
 */
export function mapMetaPostMedia(
  post: MetaPost,
  platform: Platform,
  postUrl: string,
  authorHandle: string,
): ResolvedMedia | null {
  const items = mapMetaPostItems(post);
  if (!items) return null;
  if (items.length === 0) {
    throw new MediaResolutionError("no-media");
  }
  return { platform, postUrl, authorHandle, items };
}

import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import { threadsPostUrl } from "@/lib/server/map-threads-embed";
import { labelForDimensions } from "@/lib/server/video-quality-label";

const SJS_SCRIPT_PATTERN =
  /<script\b[^>]*type="application\/json"[^>]*\bdata-sjs\b[^>]*>([\s\S]*?)<\/script>/g;

// Threads' media_type values.
const MEDIA_TYPE_IMAGE = 1;
const MEDIA_TYPE_VIDEO = 2;
const MEDIA_TYPE_CAROUSEL = 8;

interface ThreadsImageCandidate {
  width?: number;
  height?: number;
  url: string;
}

interface ThreadsPost {
  code: string;
  media_type: number;
  user?: { username?: string };
  original_width?: number;
  original_height?: number;
  video_versions?: { url: string }[] | null;
  image_versions2?: { candidates?: ThreadsImageCandidate[] } | null;
}

function isThreadsPost(value: unknown, shortcode: string): value is ThreadsPost {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ThreadsPost>;
  return candidate.code === shortcode && typeof candidate.media_type === "number";
}

// Depth-first search across the page's server-rendered JSON. The page also
// embeds replies, the rest of the author's self-thread and quoted posts —
// some with media of their own — so only an object whose `code` is the
// requested shortcode counts.
function findPost(root: unknown, shortcode: string): ThreadsPost | null {
  const stack: unknown[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (isThreadsPost(node, shortcode)) return node;
    if (Array.isArray(node)) {
      stack.push(...node);
    } else if (typeof node === "object" && node !== null) {
      stack.push(...Object.values(node));
    }
  }
  return null;
}

function largestImage(post: ThreadsPost): ThreadsImageCandidate | undefined {
  const candidates = post.image_versions2?.candidates ?? [];
  return [...candidates].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
}

/**
 * Maps a Threads post page (fetched with a crawler User-Agent, which gets
 * server-rendered JSON instead of an empty app shell) to ResolvedMedia.
 * Pure/no I/O. The fallback for when the embed page is inconclusive.
 */
export function mapThreadsPageToMedia(html: string, shortcode: string): ResolvedMedia {
  let post: ThreadsPost | null = null;
  for (const match of html.matchAll(SJS_SCRIPT_PATTERN)) {
    let json: unknown;
    try {
      json = JSON.parse(match[1]);
    } catch {
      continue;
    }
    post = findPost(json, shortcode);
    if (post) break;
  }

  if (!post) {
    throw new MediaResolutionError("not-found");
  }

  const authorHandle = post.user?.username;
  if (!authorHandle) {
    throw new MediaResolutionError("unsupported-post");
  }

  const postUrl = threadsPostUrl(authorHandle, shortcode);

  if (post.media_type === MEDIA_TYPE_CAROUSEL) {
    throw new MediaResolutionError("multi-media-unsupported");
  }

  if (post.media_type === MEDIA_TYPE_VIDEO) {
    const videoUrl = post.video_versions?.[0]?.url;
    if (!videoUrl) {
      throw new MediaResolutionError("no-media");
    }
    const width = post.original_width ?? 0;
    const height = post.original_height ?? 0;
    return {
      platform: "threads",
      postUrl,
      authorHandle,
      kind: "video",
      posterUrl: largestImage(post)?.url,
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

  if (post.media_type === MEDIA_TYPE_IMAGE) {
    const imageUrl = largestImage(post)?.url;
    if (!imageUrl) {
      throw new MediaResolutionError("no-media");
    }
    return { platform: "threads", postUrl, authorHandle, kind: "image", imageUrl };
  }

  // Text posts (media_type 19) and anything else we don't recognise.
  throw new MediaResolutionError("no-media");
}

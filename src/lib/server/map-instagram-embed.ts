import type { ResolvedMedia, ResolvedMediaItem } from "@/lib/server/resolved-media";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import { decodeHtmlEntities } from "@/lib/server/html-entities";
import { labelForDimensions } from "@/lib/server/video-quality-label";

// See docs/adr/0004-instagram-extraction-via-embed.md. A deleted, private or
// login-gated post renders this block instead of the post.
const BROKEN_MEDIA_MARKER = 'class="EmbedBrokenMedia"';
// GraphImage, GraphVideo or GraphSidecar (a carousel).
const MEDIA_TYPE_PATTERN = /<div class="Embed"[^>]*\bdata-media-type="(\w+)"/;
// "Rich" embeds (videos, carousels) pass the post as a JSON-encoded string
// in their init data; "simple" ones (images) pass null. Matched as a JSON
// string literal so it can be decoded with JSON.parse.
const CONTEXT_JSON_PATTERN = /"contextJSON":("(?:[^"\\]|\\.)*"|null)/;
// The post's media, never the header's avatar <img>.
const EMBEDDED_IMAGE_PATTERN = /<img\b[^>]*\bclass="EmbeddedMediaImage"[^>]*>/;
const SRC_PATTERN = /\bsrc="([^"]+)"/;
const SRCSET_PATTERN = /\bsrcset="([^"]+)"/;
// A collab post lists every author; the first is the owner.
const USERNAME_PATTERN = /class="UsernameText[^"]*">([^<]+)</;

// What a post and each child of a GraphSidecar have in common.
interface EmbedMediaNode {
  __typename?: string;
  is_video?: boolean;
  dimensions?: { width?: number; height?: number };
  display_url?: string;
  video_url?: string;
}

interface EmbedShortcodeMedia extends EmbedMediaNode {
  shortcode?: string;
  owner?: { username?: string };
  edge_sidecar_to_children?: { edges?: { node?: EmbedMediaNode }[] };
}

export function instagramPostUrl(shortcode: string): string {
  // /p/ serves Reels as well, so there's no need to know which one it is.
  return `https://www.instagram.com/p/${shortcode}/`;
}

function readShortcodeMedia(html: string): EmbedShortcodeMedia | null {
  const literal = html.match(CONTEXT_JSON_PATTERN)?.[1];
  if (!literal || literal === "null") return null;
  try {
    const context = JSON.parse(JSON.parse(literal) as string) as {
      gql_data?: { shortcode_media?: EmbedShortcodeMedia | null };
    };
    return context.gql_data?.shortcode_media ?? null;
  } catch {
    return null;
  }
}

// The widest "<url> <n>w" entry of a srcset, whose URLs carry no commas.
function widestSrcsetUrl(srcset: string): string | undefined {
  let widest: { url: string; width: number } | undefined;
  for (const entry of srcset.split(",")) {
    const [url, descriptor] = entry.trim().split(/\s+/);
    const width = Number.parseInt(descriptor ?? "", 10);
    if (url && Number.isFinite(width) && (!widest || width > widest.width)) {
      widest = { url, width };
    }
  }
  return widest?.url;
}

// Null when the node's media can't be read: a video without its video_url,
// or an image without a display_url.
function mapMediaNode(node: EmbedMediaNode): ResolvedMediaItem | null {
  if (node.is_video ?? node.__typename === "GraphVideo") {
    if (!node.video_url) return null;
    const width = node.dimensions?.width ?? 0;
    const height = node.dimensions?.height ?? 0;
    return {
      kind: "video",
      posterUrl: node.display_url,
      qualities: [
        {
          label: width > 0 && height > 0 ? labelForDimensions(width, height) : null,
          width,
          height,
          url: node.video_url,
          approxSizeMb: 0,
        },
      ],
    };
  }
  return node.display_url ? { kind: "image", imageUrl: node.display_url } : null;
}

function mapShortcodeMedia(
  media: EmbedShortcodeMedia,
  shortcode: string,
): ResolvedMedia | null {
  if (media.shortcode !== shortcode) return null;

  const authorHandle = media.owner?.username;
  if (!authorHandle) return null;

  const nodes: (EmbedMediaNode | undefined)[] =
    media.__typename === "GraphSidecar"
      ? (media.edge_sidecar_to_children?.edges ?? []).map((edge) => edge.node)
      : [media];
  const items = nodes.map((node) => (node ? mapMediaNode(node) : null));
  // One unreadable item makes the whole embed inconclusive, so the page
  // fallback gets a chance at the full carousel instead of a partial one.
  if (items.length === 0 || items.some((item) => item === null)) return null;

  return {
    platform: "instagram",
    postUrl: instagramPostUrl(shortcode),
    authorHandle,
    items: items.filter((item) => item !== null),
  };
}

/**
 * Maps an Instagram embed page (`/p/<shortcode>/embed/captioned/`) to
 * ResolvedMedia, one item per carousel entry. Pure/no I/O. Throws
 * MediaResolutionError when the embed is conclusive (post unavailable →
 * not-found) and returns null when it isn't — no post data or media we
 * recognise — so the caller can fall back to the full post page.
 */
export function mapInstagramEmbedToMedia(html: string, shortcode: string): ResolvedMedia | null {
  if (html.includes(BROKEN_MEDIA_MARKER)) {
    throw new MediaResolutionError("not-found");
  }

  const shortcodeMedia = readShortcodeMedia(html);
  if (shortcodeMedia) return mapShortcodeMedia(shortcodeMedia, shortcode);

  // A simple embed: only images are rendered as plain markup.
  if (html.match(MEDIA_TYPE_PATTERN)?.[1] !== "GraphImage") return null;

  const imageTag = html.match(EMBEDDED_IMAGE_PATTERN)?.[0];
  const usernameMatch = html.match(USERNAME_PATTERN);
  if (!imageTag || !usernameMatch) return null;

  const srcset = imageTag.match(SRCSET_PATTERN)?.[1];
  const src = imageTag.match(SRC_PATTERN)?.[1];
  const rawUrl = (srcset && widestSrcsetUrl(decodeHtmlEntities(srcset))) ?? (src && decodeHtmlEntities(src));
  if (!rawUrl) return null;

  return {
    platform: "instagram",
    postUrl: instagramPostUrl(shortcode),
    authorHandle: decodeHtmlEntities(usernameMatch[1].trim()),
    items: [{ kind: "image", imageUrl: rawUrl }],
  };
}

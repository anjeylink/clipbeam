import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import { instagramPostUrl } from "@/lib/server/map-instagram-embed";
import { findMetaPost, mapMetaPostMedia } from "@/lib/server/meta-page-json";

/**
 * Maps an Instagram post page (fetched with a crawler User-Agent, which gets
 * server-rendered JSON) to ResolvedMedia. Pure/no I/O. The fallback for
 * when the embed page is inconclusive.
 */
export function mapInstagramPageToMedia(html: string, shortcode: string): ResolvedMedia {
  const post = findMetaPost(html, shortcode, { requireMedia: true });
  if (!post) {
    throw new MediaResolutionError("not-found");
  }

  const authorHandle = post.user?.username;
  if (!authorHandle) {
    throw new MediaResolutionError("unsupported-post");
  }

  const media = mapMetaPostMedia(post, "instagram", instagramPostUrl(shortcode), authorHandle);
  if (media) return media;

  throw new MediaResolutionError("no-media");
}

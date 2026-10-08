import type { ResolvedMedia } from "@/lib/server/resolved-media";
import { MediaResolutionError } from "@/lib/server/media-resolution-error";
import { threadsPostUrl } from "@/lib/server/map-threads-embed";
import { findMetaPost, mapMetaPostMedia } from "@/lib/server/meta-page-json";

/**
 * Maps a Threads post page (fetched with a crawler User-Agent, which gets
 * server-rendered JSON instead of an empty app shell) to ResolvedMedia.
 * Pure/no I/O. The fallback for when the embed page is inconclusive.
 */
export function mapThreadsPageToMedia(html: string, shortcode: string): ResolvedMedia {
  const post = findMetaPost(html, shortcode);
  if (!post) {
    throw new MediaResolutionError("not-found");
  }

  const authorHandle = post.user?.username;
  if (!authorHandle) {
    throw new MediaResolutionError("unsupported-post");
  }

  const postUrl = threadsPostUrl(authorHandle, shortcode);

  const media = mapMetaPostMedia(post, "threads", postUrl, authorHandle);
  if (media) return media;

  // A post with no media of its own may still carry another post's: an
  // Instagram post it links to, or the post it quotes. Either is credited to
  // the author who made the media, not to the Threads user who shared it.
  const info = post.text_post_app_info;
  for (const shared of [info?.linked_inline_media, info?.share_info?.quoted_post]) {
    const sharedMedia =
      shared && mapMetaPostMedia(shared, "threads", postUrl, shared.user?.username ?? authorHandle);
    if (sharedMedia) return sharedMedia;
  }

  // Text posts (media_type 19) and anything else we don't recognise.
  throw new MediaResolutionError("no-media");
}

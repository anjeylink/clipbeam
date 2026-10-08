export type Platform = "x" | "instagram" | "threads";

export type MediaKind = "image" | "video";

// proxiedUrl is always a same-origin /api/download?url=... string: safe to
// fetch (Share's blob prefetch) or turn into an attachment download
// (appendDownloadFilename) regardless of media kind. A null label means the
// Platform didn't report dimensions (Threads embeds), so the UI shows a
// translated "Original" instead.
export interface VideoQualityOption {
  label: string | null;
  width: number;
  height: number;
  approxSizeMb: number;
  proxiedUrl: string;
}

// One image or video of a Post. A true discriminated union, so reading an
// image's URLs or a video's qualities needs no `!` once `kind` is narrowed.
export type MediaItem =
  | {
      kind: "image";
      // Raw pbs.twimg.com URL for X, deliberately unproxied: pbs allows
      // hotlinking (unlike video.twimg.com), so <img src> skips our server
      // round-trip. Proxied for Threads and Instagram, whose URLs are
      // signed and expire.
      previewUrl: string;
      proxiedUrl: string;
    }
  | {
      kind: "video";
      // Absent when the Platform gave no poster (Threads embeds).
      posterUrl?: string;
      qualities: VideoQualityOption[];
    };

export interface ParsedMedia {
  platform: Platform;
  postUrl: string;
  authorHandle: string;
  // In the Post's own order, never empty: one item for a plain Post, several
  // for a carousel.
  items: MediaItem[];
}

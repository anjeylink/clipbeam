export type Platform = "x" | "threads";

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

// True discriminated union: image and video no longer share optional
// imageUrl?/qualities? fields, so reading either no longer needs a `!`
// non-null assertion once `kind` is narrowed.
export type ParsedMedia =
  | {
      platform: Platform;
      kind: "image";
      postUrl: string;
      authorHandle: string;
      // Raw pbs.twimg.com URL for X, deliberately unproxied: pbs allows
      // hotlinking (unlike video.twimg.com), so <img src> skips our server
      // round-trip. Proxied for Threads, whose URLs are signed and expire.
      previewUrl: string;
      proxiedUrl: string;
    }
  | {
      platform: Platform;
      kind: "video";
      postUrl: string;
      authorHandle: string;
      // Absent when the Platform gave no poster (Threads embeds).
      posterUrl?: string;
      qualities: VideoQualityOption[];
    };

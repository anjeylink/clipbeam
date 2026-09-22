export type MediaKind = "image" | "video";

// proxiedUrl is always a same-origin /api/download?url=... string: safe to
// fetch (Share's blob prefetch) or turn into an attachment download
// (appendDownloadFilename) regardless of media kind.
export interface VideoQualityOption {
  label: string;
  width: number;
  height: number;
  approxSizeMb: number;
  proxiedUrl: string;
}

// True discriminated union: image and video no longer share optional
// imageUrl?/qualities? fields, so reading either no longer needs a `!`
// non-null assertion once `kind` is narrowed.
export type ParsedXMedia =
  | {
      kind: "image";
      postUrl: string;
      authorHandle: string;
      posterUrl: string;
      // Raw pbs.twimg.com URL, deliberately unproxied: pbs allows hotlinking
      // (unlike video.twimg.com), so <img src> skips our server round-trip.
      previewUrl: string;
      proxiedUrl: string;
    }
  | {
      kind: "video";
      postUrl: string;
      authorHandle: string;
      posterUrl: string;
      qualities: VideoQualityOption[];
    };

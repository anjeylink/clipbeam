// Server-internal shape, never serialized to the client: URLs here are the
// raw upstream CDN URLs straight from Twitter's syndication payload.
// enrichVideoQualitySizes probes these directly (HEAD request against the
// real CDN), which is why proxying can't happen before that step runs.
// toClientMedia() is the only place that turns this into the client-facing
// ParsedXMedia, with every URL either hotlink-safe or already proxied.
export type MediaKind = "image" | "video";

export interface ResolvedVideoQuality {
  label: string;
  width: number;
  height: number;
  url: string;
  approxSizeMb: number;
}

export interface ResolvedMedia {
  postUrl: string;
  authorHandle: string;
  kind: MediaKind;
  posterUrl: string;
  imageUrl?: string;
  qualities?: ResolvedVideoQuality[];
}

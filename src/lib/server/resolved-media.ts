// Server-internal shape, never serialized to the client: URLs here are the
// raw upstream CDN URLs straight from the Platform (Twitter's syndication
// payload, a Threads embed/page).
// enrichVideoQualitySizes probes these directly (HEAD request against the
// real CDN), which is why proxying can't happen before that step runs.
// toClientMedia() is the only place that turns this into the client-facing
// ParsedMedia, with every URL either hotlink-safe or already proxied.
import type { MediaKind, Platform } from "@/lib/media-types";

export type { MediaKind, Platform };

export interface ResolvedVideoQuality {
  label: string | null;
  width: number;
  height: number;
  url: string;
  approxSizeMb: number;
}

export interface ResolvedMedia {
  platform: Platform;
  postUrl: string;
  authorHandle: string;
  kind: MediaKind;
  posterUrl?: string;
  imageUrl?: string;
  qualities?: ResolvedVideoQuality[];
}

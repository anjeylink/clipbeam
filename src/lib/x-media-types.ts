export type MediaKind = "image" | "video";

export interface VideoQualityOption {
  label: string;
  width: number;
  height: number;
  url: string;
  approxSizeMb: number;
}

export interface ParsedXMedia {
  postUrl: string;
  authorHandle: string;
  kind: MediaKind;
  posterUrl: string;
  imageUrl?: string;
  qualities?: VideoQualityOption[];
}

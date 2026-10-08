import type { Platform } from "@/lib/media-types";

// One landing page per Platform. The slug is the URL people land on from
// search, so it follows what they type ("twitter", not "x") and must not
// change once indexed. lastModified is the day the page's copy last changed
// — bump it by hand; a build timestamp would teach crawlers to ignore it.
export const PLATFORM_PAGES: Record<Platform, { slug: string; lastModified: string }> = {
  instagram: { slug: "instagram-video-downloader", lastModified: "2026-10-08" },
  x: { slug: "twitter-video-downloader", lastModified: "2026-10-08" },
  threads: { slug: "threads-video-downloader", lastModified: "2026-10-08" },
};

// In the order the copy names them everywhere: Instagram, X, Threads.
export const PLATFORMS = Object.keys(PLATFORM_PAGES) as Platform[];

/** The landing page's locale-less path, e.g. "/instagram-video-downloader". */
export function platformPagePath(platform: Platform): string {
  return `/${PLATFORM_PAGES[platform].slug}`;
}

export function platformForSlug(slug: string): Platform | undefined {
  return PLATFORMS.find((platform) => PLATFORM_PAGES[platform].slug === slug);
}

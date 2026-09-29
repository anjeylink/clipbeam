/**
 * The path segment the whole app lives under: pages at /explorer and
 * /{locale}/explorer, the API at /explorer/api, assets at /explorer/_next
 * (next.config.ts assetPrefix). It's a real route segment, not a Next.js
 * basePath, so anything that builds a root-relative URL — a fetch, a link,
 * a sitemap entry — prefixes it through appPath.
 */
export const APP_SEGMENT = "/explorer";

/** Prefixes a root-relative path with the app segment; "/" maps to the segment itself. */
export function appPath(path: string): string {
  if (!path.startsWith("/")) throw new Error(`appPath expects a root-relative path, got "${path}"`);
  return path === "/" ? APP_SEGMENT : `${APP_SEGMENT}${path}`;
}

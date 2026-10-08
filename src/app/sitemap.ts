import type { MetadataRoute } from "next";
import { getLocalizedUrl, locales } from "intlayer";
import { PLATFORM_PAGES, PLATFORMS, platformPagePath } from "@/lib/platform-pages";
import { absoluteUrl, localeAlternates } from "@/lib/seo";

// Locale-less paths of every indexable page, with the day its content last
// changed. Bump the date by hand when a page's copy changes — the legal
// pages' matches their visible "Last updated" line.
const PAGES = [
  { path: "/", lastModified: "2026-10-08" },
  ...PLATFORMS.map((platform) => ({
    path: platformPagePath(platform),
    lastModified: PLATFORM_PAGES[platform].lastModified,
  })),
  { path: "/terms", lastModified: "2026-09-16" },
  { path: "/privacy", lastModified: "2026-09-16" },
  { path: "/dmca", lastModified: "2026-09-16" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(({ path, lastModified }) => {
    const languages = Object.fromEntries(
      Object.entries(localeAlternates(path)).map(([lang, url]) => [
        lang,
        absoluteUrl(url),
      ]),
    );

    return locales.map((locale) => ({
      url: absoluteUrl(getLocalizedUrl(path, locale)),
      lastModified,
      alternates: { languages },
    }));
  });
}

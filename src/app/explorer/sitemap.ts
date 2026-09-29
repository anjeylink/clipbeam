import type { MetadataRoute } from "next";
import { getLocalizedUrl, locales } from "intlayer";
import { appPath } from "@/lib/app-path";
import { absoluteUrl, localeAlternates } from "@/lib/seo";

// Locale-less paths of every indexable page. Served at /explorer/sitemap.xml,
// alongside the pages it lists.
const PAGES = ["/", "/terms", "/privacy", "/dmca"].map(appPath);

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((path) => {
    const languages = Object.fromEntries(
      Object.entries(localeAlternates(path)).map(([lang, url]) => [
        lang,
        absoluteUrl(url),
      ]),
    );

    return locales.map((locale) => ({
      url: absoluteUrl(getLocalizedUrl(path, locale)),
      alternates: { languages },
    }));
  });
}

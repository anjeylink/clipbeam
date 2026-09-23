import type { MetadataRoute } from "next";
import { getLocalizedUrl, locales } from "intlayer";
import { absoluteUrl, localeAlternates } from "@/lib/seo";

// Locale-less paths of every indexable page.
const PAGES = ["/", "/terms", "/privacy", "/dmca"];

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

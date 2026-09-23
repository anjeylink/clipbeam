import {
  defaultLocale,
  getLocalizedUrl,
  getMultilingualUrls,
  type Locale,
} from "intlayer";
import type { Metadata } from "next";

// The deployed origin. Every canonical, hreflang, Open Graph, and sitemap
// URL is resolved against it, so it must be set in production.
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
);

export const SITE_NAME = "ClipBeam";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

const OPEN_GRAPH_LOCALES: Record<string, string> = {
  en: "en_US",
  uk: "uk_UA",
};

/**
 * hreflang map for a locale-less path: one entry per locale (the page's own
 * included — Next.js doesn't add it) plus x-default, pointing at the
 * unprefixed default-locale URL.
 */
export function localeAlternates(path: string): Record<string, string> {
  const urls = getMultilingualUrls(path) as Record<string, string>;
  return { ...urls, "x-default": getLocalizedUrl(path, defaultLocale) };
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}

type PageMetadataInput = {
  locale: Locale;
  // The page's path without a locale prefix, e.g. "/" or "/terms".
  path: string;
  title: string;
  description: string;
  // The share image's alt text (the "og-image" dictionary's `alt`).
  imageAlt: string;
};

/**
 * Per-page metadata: a self-referencing canonical (which also drops any
 * query string, e.g. the clip tool's ?url=), hreflang alternates, and the
 * Open Graph / Twitter card, whose image is the locale's /[locale]/og.png.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  imageAlt,
}: PageMetadataInput): Metadata {
  const canonical = getLocalizedUrl(path, locale);
  // Always prefixed, even for the default locale: dotted paths skip the
  // proxy, so /en/og.png is served directly rather than redirected.
  const image = {
    url: `/${locale}/og.png`,
    ...OG_IMAGE_SIZE,
    type: "image/png",
    alt: imageAlt,
  };

  return {
    title,
    description,
    alternates: { canonical, languages: localeAlternates(path) },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: Object.entries(OPEN_GRAPH_LOCALES)
        .filter(([key]) => key !== locale)
        .map(([, value]) => value),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

type HomeStructuredDataInput = {
  locale: Locale;
  description: string;
  faq: { question: string; answer: string }[];
};

/**
 * JSON-LD for the home page: the tool itself as a free WebApplication, plus
 * the FAQ section shown on the page (FAQPage must mirror visible content).
 */
export function homeStructuredData({
  locale,
  description,
  faq,
}: HomeStructuredDataInput) {
  const url = absoluteUrl(getLocalizedUrl("/", locale));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url,
        description,
        inLanguage: locale,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        url,
        inLanguage: locale,
        mainEntity: faq.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}

/**
 * Serializes JSON-LD for a <script> tag. "<" is escaped so no string in the
 * data can close the tag early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

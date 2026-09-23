// intlayer loads its config through esbuild, which breaks under jsdom.
// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  homeStructuredData,
  localeAlternates,
  pageMetadata,
  serializeJsonLd,
} from "./seo";

describe("localeAlternates", () => {
  it("lists every locale, the default one unprefixed, plus x-default", () => {
    expect(localeAlternates("/terms")).toEqual({
      en: "/terms",
      uk: "/uk/terms",
      "x-default": "/terms",
    });
  });

  it("handles the home page", () => {
    expect(localeAlternates("/")).toEqual({ en: "/", uk: "/uk", "x-default": "/" });
  });
});

describe("absoluteUrl", () => {
  it("resolves a path against the site origin", () => {
    expect(absoluteUrl("/uk/privacy")).toBe("http://localhost:3000/uk/privacy");
  });
});

describe("pageMetadata", () => {
  const metadata = pageMetadata({
    locale: "uk",
    path: "/dmca",
    title: "Title",
    description: "Description",
    imageAlt: "Alt",
  });

  it("canonicalizes to the page's own locale URL", () => {
    expect(metadata.alternates?.canonical).toBe("/uk/dmca");
    expect(metadata.openGraph?.url).toBe("/uk/dmca");
  });

  it("sets the Open Graph locale and its alternates", () => {
    expect(metadata.openGraph).toMatchObject({
      locale: "uk_UA",
      alternateLocale: ["en_US"],
    });
  });

  it("attaches the locale's share image", () => {
    const image = {
      url: "/uk/og.png",
      width: 1200,
      height: 630,
      alt: "Alt",
    };
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining(image)]);
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: [expect.objectContaining(image)],
    });
  });
});

describe("homeStructuredData", () => {
  const data = homeStructuredData({
    locale: "uk",
    description: "Description",
    faq: [{ question: "Q?", answer: "A." }],
  });

  it("describes the app at the locale's absolute home URL", () => {
    expect(data["@graph"][0]).toMatchObject({
      "@type": "WebApplication",
      url: "http://localhost:3000/uk",
      inLanguage: "uk",
    });
  });

  it("mirrors the FAQ as Question/Answer pairs", () => {
    expect(data["@graph"][1]).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } },
      ],
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a string can't close the script tag", () => {
    expect(serializeJsonLd({ text: "</script><b>" })).toBe(
      '{"text":"\\u003c/script>\\u003cb>"}',
    );
  });
});

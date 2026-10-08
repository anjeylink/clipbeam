import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getIntlayer, getLocalizedUrl, type Locale } from "intlayer";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { PlatformLinks } from "@/components/platform-links";
import { SiteFooter } from "@/components/site-footer";
import { PLATFORM_PAGES, PLATFORMS, platformForSlug } from "@/lib/platform-pages";
import { breadcrumbStructuredData, pageMetadata, serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PLATFORMS.map((platform) => ({
    platformSlug: PLATFORM_PAGES[platform].slug,
  }));
}

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/[platformSlug]">): Promise<Metadata> => {
  const { locale, platformSlug } = await params;
  const platform = platformForSlug(platformSlug);
  if (!platform) return {};

  const { title, description } = getIntlayer(
    "platform-page-metadata",
    locale as Locale,
  )[platform];

  return pageMetadata({
    locale: locale as Locale,
    path: `/${platformSlug}`,
    title,
    description,
    imageAlt: getIntlayer("og-image", locale as Locale).alt,
  });
};

export default async function PlatformPage({
  params,
}: PageProps<"/[locale]/[platformSlug]">) {
  const { locale, platformSlug } = await params;
  const platform = platformForSlug(platformSlug);
  // dynamicParams already 404s this in production; `next dev` ignores it.
  if (!platform) notFound();

  const content = getIntlayer("platform-page", locale as Locale);
  const page = content.pages[platform];
  const structuredData = breadcrumbStructuredData({
    locale: locale as Locale,
    crumbs: [
      { name: content.home, path: "/" },
      { name: page.name, path: `/${platformSlug}` },
    ],
  });

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <nav
          aria-label={content.breadcrumbNavLabel}
          className="mx-auto w-full max-w-5xl px-4 pt-6 text-xs text-muted-foreground"
        >
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href={getLocalizedUrl("/", locale as Locale)}
                className="hover:text-foreground"
              >
                {content.home}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{page.name}</li>
          </ol>
        </nav>
        <HeroSection heading={page.heading} subtext={page.subtext} />
        <HowItWorks />
        <article className="w-full px-4 py-12">
          <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {page.sections.map((section, index) => (
              <section key={index} className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold tracking-tight">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-sm leading-relaxed sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
        <PlatformLinks current={platform} />
      </main>
      <SiteFooter />
    </div>
  );
}

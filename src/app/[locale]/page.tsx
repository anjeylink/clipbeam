import type { Metadata } from "next";
import { getIntlayer, type Locale } from "intlayer";
import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { HowItWorks } from "@/components/how-it-works";
import { FeatureBullets } from "@/components/feature-bullets";
import { Faq } from "@/components/faq";
import { PlatformLinks } from "@/components/platform-links";
import { SiteFooter } from "@/components/site-footer";
import { homeStructuredData, pageMetadata, serializeJsonLd } from "@/lib/seo";

export const dynamic = "force-static";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer(
    "page-metadata",
    locale as Locale,
  );

  return pageMetadata({
    locale: locale as Locale,
    path: "/",
    title,
    description,
    imageAlt: getIntlayer("og-image", locale as Locale).alt,
  });
};

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const { description } = getIntlayer("page-metadata", locale as Locale);
  const { items } = getIntlayer("faq", locale as Locale);
  const hero = getIntlayer("hero-section", locale as Locale);
  const structuredData = homeStructuredData({
    locale: locale as Locale,
    description,
    faq: items,
  });

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <HeroSection heading={hero.heading} subtext={hero.subtext} />
        <HowItWorks />
        <FeatureBullets />
        <PlatformLinks />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}

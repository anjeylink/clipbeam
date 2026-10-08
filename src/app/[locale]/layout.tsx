import type { Metadata } from "next";
import type { Locale } from "intlayer";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { SiteDocument } from "@/components/site-document";
import "../globals.css";

export { generateStaticParams } from "next-intlayer";

// Only the configured locales exist. Without this, any first segment the
// proxy lets through (every path with a dot, e.g. /llms.txt) rendered the
// home page with a 200 and <html lang="llms.txt">.
export const dynamicParams = false;

// Pages set their own title, description, canonical, and hreflang (see
// pageMetadata in src/lib/seo.ts); this resolves their relative URLs.
export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: SITE_NAME,
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;

  return <SiteDocument locale={locale as Locale}>{children}</SiteDocument>;
}

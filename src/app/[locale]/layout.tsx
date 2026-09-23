import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getHTMLTextDir } from "intlayer";
import { IntlayerProvider } from "next-intlayer/server";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "../globals.css";

export { generateStaticParams } from "next-intlayer";

// Only the configured locales exist. Without this, any first segment the
// proxy lets through (every path with a dot, e.g. /llms.txt) rendered the
// home page with a 200 and <html lang="llms.txt">.
export const dynamicParams = false;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

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

  return (
    <html
      lang={locale}
      dir={getHTMLTextDir(locale)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IntlayerProvider locale={locale}>{children}</IntlayerProvider>
      </body>
    </html>
  );
}

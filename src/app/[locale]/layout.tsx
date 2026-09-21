import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getHTMLTextDir, getIntlayer, type Locale } from "intlayer";
import { IntlayerProvider } from "next-intlayer/server";
import "../globals.css";

export { generateStaticParams } from "next-intlayer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const generateMetadata = async ({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer(
    "page-metadata",
    locale as Locale,
  );

  return { title, description };
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

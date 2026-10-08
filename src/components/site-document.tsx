import type { PropsWithChildren } from "react";
import { getHTMLTextDir, type Locale } from "intlayer";
import { IntlayerProvider } from "next-intlayer/server";
import { Analytics } from "@vercel/analytics/next";
import { BeamMessageListener } from "@/components/beam/beam-message-listener";
import { FONT_VARIABLES } from "@/lib/fonts";

// The <html> shell every page shares. The root layout is a bare fragment, so
// both the locale layout and the global not-found page have to render it.
export function SiteDocument({
  locale,
  children,
}: PropsWithChildren<{ locale: Locale }>) {
  return (
    <html
      lang={locale}
      dir={getHTMLTextDir(locale)}
      className={`${FONT_VARIABLES} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IntlayerProvider locale={locale}>
          <BeamMessageListener />
          {children}
        </IntlayerProvider>
        <Analytics />
      </body>
    </html>
  );
}

import { getLocale } from "next-intlayer/server";
import { DocumentLinks } from "@/components/document-links";
import { NotFoundPage } from "@/components/not-found-page";
import { SiteDocument } from "@/components/site-document";
import "./globals.css";

// Serves every URL no route matches. It renders outside the locale layout, so
// the locale comes from the request: the proxy's header, or the visitor's
// saved locale for the dotted paths that skip the proxy (/llms.txt).
export default async function GlobalNotFound() {
  const locale = await getLocale();

  return (
    <SiteDocument locale={locale}>
      <DocumentLinks>
        <NotFoundPage />
      </DocumentLinks>
    </SiteDocument>
  );
}

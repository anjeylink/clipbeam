import type { Metadata } from "next";
import { getIntlayer } from "intlayer";
import { getLocale } from "next-intlayer/server";
import { useIntlayer } from "next-intlayer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-static";

export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale();
  const { title, description } = getIntlayer("terms-page-metadata", locale);

  return { title, description };
};

export default function TermsPage() {
  const content = useIntlayer("terms-page");

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <LegalPage
          title={content.title}
          updatedAt={content.updatedAt}
          intro={content.intro}
          sections={content.sections}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

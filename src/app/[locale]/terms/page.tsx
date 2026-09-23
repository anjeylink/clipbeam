import type { Metadata } from "next";
import { getIntlayer, type Locale } from "intlayer";
import { useIntlayer } from "next-intlayer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalPage } from "@/components/legal-page";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer(
    "terms-page-metadata",
    locale as Locale,
  );

  return pageMetadata({
    locale: locale as Locale,
    path: "/terms",
    title,
    description,
    imageAlt: getIntlayer("og-image", locale as Locale).alt,
  });
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

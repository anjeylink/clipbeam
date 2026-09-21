import type { Metadata } from "next";
import { getIntlayer, type Locale } from "intlayer";
import { useIntlayer } from "next-intlayer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-static";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/dmca">): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer(
    "dmca-page-metadata",
    locale as Locale,
  );

  return { title, description };
};

export default function DmcaPage() {
  const content = useIntlayer("dmca-page");

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

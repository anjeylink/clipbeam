import type { Metadata } from "next";
import { getIntlayer, type Locale } from "intlayer";
import { useIntlayer } from "next-intlayer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { BeamPairForm } from "@/components/beam/beam-pair-form";
import { BeamSendForm } from "@/components/beam/beam-send-form";
import { BeamDevice } from "@/components/beam/beam-device";
import { isBeamPaired } from "@/lib/server/beam/beam-session";

// Private, single-user page: kept out of the sitemap and search results,
// and nothing public links to it (see BeamFooterLink).
export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/beam">): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer("beam-page-metadata", locale as Locale);

  return { title, description, robots: { index: false, follow: false } };
};

function BeamContent({ paired }: { paired: boolean }) {
  const content = useIntlayer("beam-page");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
        <p className="text-sm text-muted-foreground">{content.intro}</p>
      </div>

      {paired ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-base font-medium">{content.sendHeading}</h2>
              <BeamSendForm />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <h2 className="text-base font-medium">{content.deviceHeading}</h2>
              <BeamDevice />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent>
            <BeamPairForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function BeamPage() {
  const paired = await isBeamPaired();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <BeamContent paired={paired} />
      </main>
      <SiteFooter />
    </div>
  );
}

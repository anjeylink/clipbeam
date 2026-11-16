import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getIntlayer, getLocalizedUrl, type Locale } from "intlayer";
import { useIntlayer } from "next-intlayer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { BeamConnectForm } from "@/components/beam/beam-connect-form";
import { BeamDevice } from "@/components/beam/beam-device";
import { BeamDisconnectButton } from "@/components/beam/beam-disconnect-button";
import { BeamSendForm } from "@/components/beam/beam-send-form";
import {
  BEAM_DEVICE_PARAM,
  BEAM_NOTICE_PARAM,
  PHONE_GONE_NOTICE,
  type BeamDeviceView,
} from "@/lib/beam";
import { beamPhoneId } from "@/lib/server/beam/beam-session";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/beam">): Promise<Metadata> => {
  const { locale } = await params;
  const { title, description } = getIntlayer("beam-page-metadata", locale as Locale);

  return pageMetadata({
    locale: locale as Locale,
    path: "/beam",
    title,
    description,
    imageAlt: getIntlayer("og-image", locale as Locale).alt,
  });
};

type BeamView =
  | { kind: "connected" }
  | { kind: "computer"; phoneGone: boolean }
  | { kind: "phone" };

function BeamContent({ view, beamUrl }: { view: BeamView; beamUrl: string }) {
  const content = useIntlayer("beam-page");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
        <p className="text-sm text-muted-foreground">{content.intro}</p>
      </div>

      {view.kind === "connected" ? (
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-medium">{content.sendHeading}</h2>
              <BeamSendForm />
            </div>
            <BeamDisconnectButton />
          </CardContent>
        </Card>
      ) : view.kind === "computer" ? (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="text-base font-medium">{content.computer.heading}</h2>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
              <li>
                {content.computer.openOnPhone}{" "}
                <span className="font-medium whitespace-nowrap">{beamUrl}</span>
              </li>
              {content.computer.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            <BeamConnectForm phoneGone={view.phoneGone} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 className="text-base font-medium">{content.phone.heading}</h2>
            <BeamDevice computerUrl={beamUrl} />
          </CardContent>
        </Card>
      )}

      {view.kind === "connected" ? null : (
        <p className="text-sm text-muted-foreground">
          <Link
            href={`?${BEAM_DEVICE_PARAM}=${view.kind === "phone" ? "computer" : "phone"}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {view.kind === "phone" ? content.switchToComputer : content.switchToPhone}
          </Link>
        </p>
      )}
    </div>
  );
}

function guessDeviceView(userAgent: string): BeamDeviceView {
  return /iPhone|iPod|Android/.test(userAgent) ? "phone" : "computer";
}

export default async function BeamPage({
  params,
  searchParams,
}: PageProps<"/[locale]/beam">) {
  const [{ locale }, query, requestHeaders, connectedPhone] = await Promise.all([
    params,
    searchParams,
    headers(),
    beamPhoneId("computer"),
  ]);

  const asked = query[BEAM_DEVICE_PARAM];
  const deviceView: BeamDeviceView =
    asked === "phone" || asked === "computer"
      ? asked
      : guessDeviceView(requestHeaders.get("user-agent") ?? "");

  const view: BeamView = connectedPhone
    ? { kind: "connected" }
    : deviceView === "computer"
      ? { kind: "computer", phoneGone: query[BEAM_NOTICE_PARAM] === PHONE_GONE_NOTICE }
      : { kind: "phone" };

  const { host, pathname } = new URL(absoluteUrl(getLocalizedUrl("/beam", locale as Locale)));

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <BeamContent view={view} beamUrl={`${host}${pathname}`} />
      </main>
      <SiteFooter />
    </div>
  );
}

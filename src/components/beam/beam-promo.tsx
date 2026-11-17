"use client";

import { getLocalizedUrl } from "intlayer";
import { ArrowRight, Laptop, Smartphone } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBeamConnected } from "@/hooks/use-beam-connected";

// The home page's pointer to Beam: most people find a post on one device
// and want to share it from the other. A connected computer already has
// Beam, so it's told where to use it instead.
export function BeamPromo() {
  const { pitch, connected } = useIntlayer("beam-promo");
  const { locale } = useLocale();
  const content = useBeamConnected() ? connected : pitch;

  return (
    <section aria-labelledby="beam-promo-heading" className="w-full px-4 py-12">
      <Card className="mx-auto max-w-3xl">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-primary" aria-hidden="true">
            <Laptop className="size-6" />
            <ArrowRight className="size-4" />
            <Smartphone className="size-6" />
          </div>
          <h2 id="beam-promo-heading" className="text-xl font-semibold tracking-tight">
            {content.heading}
          </h2>
          <p className="max-w-xl text-balance text-sm text-muted-foreground">
            {content.description}
          </p>
          <Link href={getLocalizedUrl("/beam", locale)} className={buttonVariants({ size: "lg" })}>
            {content.cta}
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

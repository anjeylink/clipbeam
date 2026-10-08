"use client";

import { useEffect } from "react";
import { getHTMLTextDir, getIntlayer, getLocaleFromPath } from "intlayer";
import { usePathname } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FONT_VARIABLES } from "@/lib/fonts";
import { CONTACT_EMAIL } from "@/lib/legal-constants";
import "./globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

// Replaces the whole document when the locale layout itself throws, so it
// can't lean on the layout's provider, header, or footer.
export default function GlobalError({ error, retry }: GlobalErrorProps) {
  const locale = getLocaleFromPath(usePathname());
  const content = getIntlayer("error-page", locale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html
      lang={locale}
      dir={getHTMLTextDir(locale)}
      className={`${FONT_VARIABLES} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <title>{content.metaTitle}</title>
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 text-center">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" aria-hidden="true" />
            <span className="text-lg font-semibold tracking-tight">ClipBeam</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {content.title}
            </h1>
            <p className="max-w-xl text-balance text-muted-foreground">
              {content.description}
            </p>
          </div>
          <Button size="lg" onClick={() => retry()}>
            {content.retry}
          </Button>
          <p className="text-sm text-muted-foreground">
            {content.contact}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { getLocalizedUrl } from "intlayer";
import { useIntlayer, useLocale } from "next-intlayer";
import { StatusPage } from "@/components/status-page";
import { Button, buttonVariants } from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const content = useIntlayer("error-page");
  const { locale } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>{String(content.metaTitle)}</title>
      <StatusPage
        title={content.title}
        description={content.description}
        contact={content.contact}
      >
        <Button size="lg" onClick={() => retry()}>
          {content.retry}
        </Button>
        {/* A full load: the home page may be what failed to render. */}
        <a
          href={getLocalizedUrl("/", locale)}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          {content.home}
        </a>
      </StatusPage>
    </>
  );
}

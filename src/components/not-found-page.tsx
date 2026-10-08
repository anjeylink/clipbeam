import { getLocalizedUrl } from "intlayer";
import { useIntlayer, useLocale } from "next-intlayer";
import Link from "next/link";
import { StatusPage } from "@/components/status-page";
import { buttonVariants } from "@/components/ui/button";

export function NotFoundPage() {
  const content = useIntlayer("not-found-page");
  const { locale } = useLocale();

  return (
    <>
      <title>{String(content.metaTitle)}</title>
      <StatusPage
        code="404"
        title={content.title}
        description={content.description}
        contact={content.contact}
      >
        <Link
          href={getLocalizedUrl("/", locale)}
          className={buttonVariants({ size: "lg" })}
        >
          {content.home}
        </Link>
      </StatusPage>
    </>
  );
}

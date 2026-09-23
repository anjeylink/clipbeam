import { getLocalizedUrl } from "intlayer";
import { useIntlayer, useLocale } from "next-intlayer";
import Link from "next/link";
import { BeamFooterLink } from "@/components/beam/beam-footer-link";

export function SiteFooter() {
  const content = useIntlayer("site-footer");
  const { locale } = useLocale();

  return (
    <footer className="mt-auto w-full border-t border-border px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center text-xs text-muted-foreground">
        <nav
          aria-label={String(content.legalNavLabel)}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          <Link href={getLocalizedUrl("/terms", locale)} className="hover:text-foreground">
            {content.links.terms}
          </Link>
          <Link href={getLocalizedUrl("/privacy", locale)} className="hover:text-foreground">
            {content.links.privacy}
          </Link>
          <Link href={getLocalizedUrl("/dmca", locale)} className="hover:text-foreground">
            {content.links.dmca}
          </Link>
          <BeamFooterLink />
        </nav>
        <p>{content.disclaimer}</p>
      </div>
    </footer>
  );
}

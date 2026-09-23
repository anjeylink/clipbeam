"use client";

import { Suspense } from "react";
import { getLocalizedUrl } from "intlayer";
import { useLocale, useIntlayer } from "next-intlayer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// `search` carries the current query string (e.g. the clip tool's ?url=)
// across the switch, so the page's URL-held state survives it.
function LocaleLinks({ search }: { search: string }) {
  const content = useIntlayer("locale-switcher");
  // "none": the <Link> below navigates (with the query); next-intlayer's
  // default would router.replace() to the bare path and drop it.
  const { locale, pathWithoutLocale, availableLocales, setLocale } = useLocale({
    onChange: "none",
  });

  return (
    <nav
      aria-label={String(content.ariaLabel)}
      className="flex items-center gap-1 text-sm font-medium"
    >
      {availableLocales.map((localeItem, index) => (
        <span key={localeItem} className="flex items-center gap-1">
          {index > 0 ? <span aria-hidden="true" className="text-muted-foreground">|</span> : null}
          <Link
            href={getLocalizedUrl(pathWithoutLocale, localeItem) + search}
            aria-current={locale === localeItem ? "page" : undefined}
            onClick={() => setLocale(localeItem)}
            replace
            className={cn(
              "rounded px-1.5 py-0.5 uppercase transition-colors",
              locale === localeItem
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {localeItem}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function LocaleLinksWithSearch() {
  const params = useSearchParams().toString();
  return <LocaleLinks search={params ? `?${params}` : ""} />;
}

export function LocaleSwitcher() {
  // useSearchParams needs a Suspense boundary on static pages; the
  // prerendered fallback is the same links, just without the query.
  return (
    <Suspense fallback={<LocaleLinks search="" />}>
      <LocaleLinksWithSearch />
    </Suspense>
  );
}

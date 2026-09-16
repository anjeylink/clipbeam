"use client";

import { getLocalizedUrl } from "intlayer";
import { useLocale, useIntlayer } from "next-intlayer";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const content = useIntlayer("locale-switcher");
  const { locale, pathWithoutLocale, availableLocales, setLocale } = useLocale();

  return (
    <nav
      aria-label={String(content.ariaLabel)}
      className="flex items-center gap-1 text-sm font-medium"
    >
      {availableLocales.map((localeItem, index) => (
        <span key={localeItem} className="flex items-center gap-1">
          {index > 0 ? <span aria-hidden="true" className="text-muted-foreground">|</span> : null}
          <Link
            href={getLocalizedUrl(pathWithoutLocale, localeItem)}
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

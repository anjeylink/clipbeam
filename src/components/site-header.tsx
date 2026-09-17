import { getLocalizedUrl } from "intlayer";
import { Zap } from "lucide-react";
import { useLocale } from "next-intlayer";
import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher/locale-switcher";

export function SiteHeader() {
  const { locale } = useLocale();

  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-4">
        <Link
          href={getLocalizedUrl("/", locale)}
          className="flex items-center gap-2"
        >
          <Zap className="size-5 text-primary" aria-hidden="true" />
          <span className="text-lg font-semibold tracking-tight">ClipBeam</span>
        </Link>
        <LocaleSwitcher />
      </div>
    </header>
  );
}

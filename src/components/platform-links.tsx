import { getLocalizedUrl } from "intlayer";
import { useIntlayer, useLocale } from "next-intlayer";
import Link from "next/link";
import type { Platform } from "@/lib/media-types";
import { PLATFORMS, platformPagePath } from "@/lib/platform-pages";

// Crawlable links to the per-Platform landing pages. A landing page passes
// itself as `current` so it only lists the other two.
export function PlatformLinks({ current }: { current?: Platform }) {
  const content = useIntlayer("platform-page");
  const { locale } = useLocale();

  return (
    <section className="w-full px-4 py-12">
      <nav
        aria-labelledby="platform-links-heading"
        className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center"
      >
        <h2 id="platform-links-heading" className="text-xl font-semibold tracking-tight">
          {content.linksHeading}
        </h2>
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {PLATFORMS.filter((platform) => platform !== current).map((platform) => (
            <li key={platform}>
              <Link
                href={getLocalizedUrl(platformPagePath(platform), locale)}
                className="text-primary underline-offset-4 hover:underline"
              >
                {content.pages[platform].linkLabel}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

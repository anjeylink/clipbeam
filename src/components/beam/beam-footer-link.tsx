"use client";

import { useSyncExternalStore } from "react";
import { getLocalizedUrl } from "intlayer";
import { useIntlayer, useLocale } from "next-intlayer";
import Link from "next/link";

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(STANDALONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// navigator.standalone is iOS's own Home Screen flag, in case its Safari
// doesn't report the display-mode media query.
function isStandalone() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

// The installed Home Screen app has no address bar and its own cookies, so
// this is the only way to reach /beam there to pair the phone. Browsers
// never render it; the page itself is still key-protected.
export function BeamFooterLink() {
  const content = useIntlayer("beam-footer-link");
  const { locale } = useLocale();
  const standalone = useSyncExternalStore(subscribe, isStandalone, () => false);

  if (!standalone) return null;

  return (
    <Link href={getLocalizedUrl("/beam", locale)} className="hover:text-foreground">
      {content.label}
    </Link>
  );
}

"use client";

import type { MouseEvent, PropsWithChildren } from "react";

function navigate(event: MouseEvent<HTMLDivElement>) {
  const link = (event.target as Element).closest("a");
  const href = link?.getAttribute("href");
  const plainClick =
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey;
  if (!href?.startsWith("/") || !plainClick) return;

  // Stops <Link>'s client-side navigation as well as the browser's own.
  event.preventDefault();
  // After the link's own onClick: the locale switcher's writes the cookie the
  // next request is routed by.
  setTimeout(() => window.location.assign(href));
}

// Makes every internal link under it load a new document. The global
// not-found page renders outside the layouts, and the router can't swap it
// out: a client-side navigation changes the URL and leaves the 404 on screen.
export function DocumentLinks({ children }: PropsWithChildren) {
  return (
    <div className="contents" onClickCapture={navigate}>
      {children}
    </div>
  );
}

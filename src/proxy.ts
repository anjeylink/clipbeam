import { defaultLocale } from "intlayer";
import { intlayerProxy } from "next-intlayer/proxy";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const DEFAULT_LOCALE_PREFIX = `/${defaultLocale}`;

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const response = intlayerProxy(request, event);
  const { pathname } = request.nextUrl;

  // intlayer strips the default locale's prefix (/en/terms → /terms) with a
  // 307. That URL has moved for good, so tell search engines it's permanent;
  // the Set-Cookie that pins the chosen locale is carried over.
  const hasDefaultPrefix =
    pathname === DEFAULT_LOCALE_PREFIX ||
    pathname.startsWith(`${DEFAULT_LOCALE_PREFIX}/`);
  if (hasDefaultPrefix && response.status === 307) {
    return new NextResponse(null, { status: 308, headers: response.headers });
  }

  return response;
}

export const config = {
  matcher:
    "/((?!api|static|assets|robots|sitemap|sw|service-worker|manifest|icon|apple-icon|.*\\..*|_next).*)",
};

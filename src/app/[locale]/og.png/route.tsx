import { ImageResponse } from "next/og";
import { getIntlayer, locales, type Locale } from "intlayer";
import { BRAND_COLORS, BrandMark } from "@/components/brand-mark";
import { OG_IMAGE_SIZE } from "@/lib/seo";

// A route handler rather than the opengraph-image convention: that one
// links the English image as /en/opengraph-image, which the proxy redirects.
// Paths with a dot skip the proxy, so /en/og.png is served as-is.
export { generateStaticParams } from "next-intlayer";
export const dynamic = "force-static";
export const dynamicParams = false;

// Next's bundled Geist covers Cyrillic, so both locales render without
// loading a font.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/[locale]/og.png">,
) {
  const { locale } = await params;
  // dynamicParams already 404s this in production; `next dev` ignores it.
  if (!(locales as string[]).includes(locale)) {
    return new Response(null, { status: 404 });
  }

  const { heading } = getIntlayer("hero-section", locale as Locale);
  const { tagline } = getIntlayer("og-image", locale as Locale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: BRAND_COLORS.background,
          color: BRAND_COLORS.foreground,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <BrandMark size={64} color={BRAND_COLORS.primary} />
          <div style={{ fontSize: 56 }}>ClipBeam</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, lineHeight: 1.1, letterSpacing: -1 }}>
            {heading}
          </div>
          <div style={{ fontSize: 36, color: BRAND_COLORS.muted }}>{tagline}</div>
        </div>
      </div>
    ),
    OG_IMAGE_SIZE,
  );
}

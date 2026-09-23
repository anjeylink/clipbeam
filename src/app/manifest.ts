import type { MetadataRoute } from "next";
import { BRAND_COLORS } from "@/components/brand-mark";
import { SITE_NAME } from "@/lib/seo";

// Brand name only: the manifest is served once for every locale, so it can't
// carry translated text.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.background,
    theme_color: BRAND_COLORS.primary,
    icons: [{ src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}

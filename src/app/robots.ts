import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A rendered ?url= page calls /api/resolve, which fetches from X,
      // Instagram or Threads; crawlers have no reason to trigger that or the
      // media proxy.
      disallow: "/api/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

import type { MetadataRoute } from "next";
import { appPath } from "@/lib/app-path";
import { absoluteUrl } from "@/lib/seo";

// Served at the origin root. Behind a front proxy that only forwards
// /explorer and /{locale}/explorer here, the parent site owns /robots.txt
// and must carry these same Disallow and Sitemap lines itself.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // A rendered ?url= page calls /api/resolve, which fetches from X,
      // Instagram or Threads; crawlers have no reason to trigger that or the
      // media proxy.
      disallow: appPath("/api/"),
    },
    sitemap: absoluteUrl(appPath("/sitemap.xml")),
  };
}

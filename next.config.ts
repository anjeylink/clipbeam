import type { NextConfig } from "next";
import { withIntlayer } from "next-intlayer/server";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ["ubuntu"],
  experimental: {
    // src/app/global-not-found.tsx: the 404 page for every unmatched URL.
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        // The Beam service worker must never be served stale, or a fix to
        // it wouldn't reach an installed phone.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withIntlayer(nextConfig);

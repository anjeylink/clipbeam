import type { NextConfig } from "next";
import { withIntlayer } from "next-intlayer/server";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone for the Docker image; Vercel
  // ignores it.
  output: "standalone",
  // Assets load from /explorer/_next so they sit under the one path the
  // front proxy routes to this app (pages live under [locale]/explorer).
  assetPrefix: "/explorer",
  reactCompiler: true,
  allowedDevOrigins: ["ubuntu"],
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

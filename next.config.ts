import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  // Native module used by the media upload pipeline — must not be bundled.
  serverExternalPackages: ["sharp"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  headers: async () => [
    {
      // The service worker must always be fresh.
      source: "/sw.js",
      headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
    },
  ],
};

export default nextConfig;

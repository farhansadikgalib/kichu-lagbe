import path from "node:path";
import type { NextConfig } from "next";

/**
 * Firebase's Google sign-in helper pages, served from THIS origin so the
 * OAuth consent screen says "to continue to <our domain>" instead of
 * "<project>.firebaseapp.com". Takes effect once NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * is set to the site's own domain and that domain's /__/auth/handler is an
 * authorized redirect URI on the Firebase OAuth client.
 * https://firebase.google.com/docs/auth/web/redirect-best-practices#proxy-requests
 */
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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
  rewrites: async () =>
    firebaseProjectId
      ? [
          {
            source: "/__/auth/:path*",
            destination: `https://${firebaseProjectId}.firebaseapp.com/__/auth/:path*`,
          },
          {
            source: "/__/firebase/:path*",
            destination: `https://${firebaseProjectId}.firebaseapp.com/__/firebase/:path*`,
          },
        ]
      : [],
};

export default nextConfig;

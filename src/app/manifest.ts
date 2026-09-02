import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#18181b",
    background_color: "#18181b",
    icons: [
      { src: "/icon-192.png?v=5", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=5", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png?v=5",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Order Snacks",
        short_name: "Order",
        description: "Browse and order snacks",
        url: "/category/snacks",
        icons: [{ src: "/icon-192.png?v=5", sizes: "192x192" }],
      },
      {
        name: "My Orders",
        short_name: "Orders",
        description: "Track your orders",
        url: "/orders",
        icons: [{ src: "/icon-192.png?v=5", sizes: "192x192" }],
      },
    ],
  };
}

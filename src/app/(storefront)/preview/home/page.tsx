import type { Metadata } from "next";
import { HomePreview } from "@/components/home/home-preview";
import { requirePageUser } from "@/lib/auth/guards";
import { getHomeLayout } from "@/lib/db/queries/home";
import { listProducts } from "@/lib/db/queries/products";

export const metadata: Metadata = {
  title: "Home page preview",
  robots: { index: false, follow: false },
};

/** Admin-only live preview target for the page builder (embedded in an iframe). */
export default async function HomePreviewPage() {
  await requirePageUser("admin");
  const [layout, products] = await Promise.all([
    getHomeLayout(),
    listProducts().catch(() => undefined),
  ]);
  return <HomePreview initialLayout={layout} initialProducts={products} />;
}

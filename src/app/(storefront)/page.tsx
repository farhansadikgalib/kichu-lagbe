import { CategoryShowcase } from "@/components/home/category-showcase";
import { CtaStrip } from "@/components/home/cta-strip";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { MarqueeStrip } from "@/components/home/marquee-strip";
import { ServiceStats } from "@/components/home/service-stats";
import { listProducts } from "@/lib/db/queries/products";

/** Static home page, regenerated in the background at most once a minute so
 * the featured grid tracks the catalog without a per-request query. */
export const revalidate = 60;

export default async function HomePage() {
  // The grid degrades to client-side loading rather than failing the page.
  const products = await listProducts().catch((err: unknown) => {
    console.error("[home] featured products unavailable:", err);
    return undefined;
  });

  return (
    <>
      <Hero />
      <MarqueeStrip />
      <ServiceStats />
      <CategoryShowcase />
      <FeaturedProducts initialProducts={products} />
      <HowItWorks />
      <CtaStrip />
    </>
  );
}

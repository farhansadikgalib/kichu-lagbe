import { CategoryShowcase } from "@/components/home/category-showcase";
import { CtaStrip } from "@/components/home/cta-strip";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { MarqueeStrip } from "@/components/home/marquee-strip";
import { ServiceStats } from "@/components/home/service-stats";

export default function HomePage() {
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <ServiceStats />
      <CategoryShowcase />
      <FeaturedProducts />
      <HowItWorks />
      <CtaStrip />
    </>
  );
}

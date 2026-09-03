import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import { SectionHeading } from "./section-heading";

const SHOWCASE = [
  {
    slug: "snacks",
    name: "Snacks",
    image: "/images/categories/fdtest.jpg",
    description: "Quick bites & midnight cravings",
  },
  {
    slug: "cigarettes",
    name: "Cigarettes",
    image: "/images/categories/cig.jpg",
    description: "All major brands, delivered fast",
  },
  {
    slug: "daily",
    name: "Daily Products",
    image: "/images/categories/daily.jpg",
    description: "Milk, eggs, bread & everyday essentials",
  },
] as const;

export function CategoryShowcase() {
  return (
    <section aria-labelledby="categories-heading" className="container-page py-16 md:py-24">
      <Reveal>
        <SectionHeading
          id="categories-heading"
          eyebrow="Shop by category"
          title="What do you need tonight?"
          description="Three categories, one late-night run — pick yours and we'll be on the way."
        />
      </Reveal>

      <Reveal stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SHOWCASE.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group relative block aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-foreground/10 outline-none transition-shadow duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 hover:shadow-xl hover:shadow-primary/10"
          >
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent"
            />
            {/* Diagonal shine sweep across the photo on hover */}
            <div
              aria-hidden
              className="absolute inset-0 -translate-x-full overflow-hidden bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
            />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="text-lg font-bold text-white">{category.name}</h3>
              <p className="mt-0.5 text-sm text-white/75">{category.description}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Shop now
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden
                />
              </p>
            </div>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}

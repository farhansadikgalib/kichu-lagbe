import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the category page layout so the swap to real content doesn't jump. */
export default function CategoryLoading() {
  return (
    <div aria-busy="true" aria-label="Loading category">
      <div className="container-page pt-8 pb-6 md:pt-12 md:pb-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-9 w-56 sm:h-11 md:h-12" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-5 flex gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </div>
      <div className="border-b border-border/60">
        <div className="container-page flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <div className="order-2 flex gap-2 md:order-1">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
          <div className="order-1 flex gap-2 md:order-2">
            <Skeleton className="h-10 flex-1 rounded-full md:w-72" />
            <Skeleton className="h-10 w-10 rounded-full sm:w-32" />
          </div>
        </div>
      </div>
      <div className="container-page pt-5 pb-16">
        <Skeleton className="h-4 w-40" />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CATALOG_TABS } from "./category-tabs";

interface CategoryChipsProps {
  active: string;
  className?: string;
}

/**
 * Horizontally scrollable lane picker. Links (not tabs) so every lane has a
 * shareable URL; the active chip is scrolled into view on small screens.
 */
export function CategoryChips({ active, className }: CategoryChipsProps) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  return (
    <nav aria-label="Categories" className={cn("-mx-4 sm:mx-0", className)}>
      <ul className="scrollbar-none flex gap-2 overflow-x-auto px-4 sm:px-0">
        {CATALOG_TABS.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <li key={tab.slug} className="shrink-0">
              <Link
                ref={isActive ? activeRef : undefined}
                href={`/category/${tab.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive
                    ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_0_1px] shadow-primary/10"
                    : "border-border/70 bg-card/60 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                )}
              >
                <span aria-hidden className="text-base leading-none">
                  {tab.emoji}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

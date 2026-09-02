"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

interface SearchInputProps {
  /** Called with the trimmed query after the debounce settles. */
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/** Debounced product search input — drives the `q` param of `useProducts`. */
export function SearchInput({
  onSearch,
  placeholder = "Search products…",
  className,
}: SearchInputProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div role="search" className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        className="h-9 pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

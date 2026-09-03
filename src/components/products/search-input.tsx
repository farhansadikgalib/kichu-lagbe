"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Controlled product search field; debounce the value where it's consumed. */
export function SearchInput({
  value,
  onValueChange,
  placeholder = "Search products…",
  className,
}: SearchInputProps) {
  return (
    <div role="search" className={cn("relative", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        enterKeyHint="search"
        autoComplete="off"
        className="h-10 rounded-full border-border/70 bg-card/60 pr-9 pl-9 text-sm shadow-none transition-colors placeholder:text-muted-foreground/80 hover:bg-card focus-visible:bg-card [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

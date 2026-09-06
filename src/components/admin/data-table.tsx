import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PageInfo } from "@/types";

/** Consistent page heading with an optional action slot (e.g. an Add button). */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Bordered card wrapper so every admin table shares one look. */
export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Table>{children}</Table>
    </div>
  );
}

interface TableStateRowsProps {
  colSpan: number;
  isLoading: boolean;
  error?: unknown;
  isEmpty: boolean;
  emptyMessage: string;
  skeletonRows?: number;
}

/**
 * Shared loading / error / empty rows for admin tables.
 * Renders nothing when data is present.
 */
export function TableStateRows({
  colSpan,
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  skeletonRows = 5,
}: TableStateRowsProps) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: skeletonRows }, (_, i) => (
          <TableRow key={i}>
            <TableCell colSpan={colSpan}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          </TableRow>
        ))}
      </>
    );
  }
  if (error) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-destructive">
          Couldn&apos;t load data. Please check your connection and try again.
        </TableCell>
      </TableRow>
    );
  }
  if (isEmpty) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="h-24 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  }
  return null;
}

interface TableSearchInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Search box for admin table toolbars (search-as-you-type; debounce upstream). */
export function TableSearchInput({
  value,
  onValueChange,
  placeholder = "Search…",
  className,
}: TableSearchInputProps) {
  return (
    <div role="search" className={cn("relative w-full sm:max-w-xs", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        className="h-9 pl-8 [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );
}

interface TablePaginationProps {
  pageInfo: PageInfo;
  onPageChange: (page: number) => void;
}

/** Prev/next pager with a "Showing X–Y of Z" summary for admin tables. */
export function TablePagination({ pageInfo, onPageChange }: TablePaginationProps) {
  const { page, pageSize, total, totalPages } = pageInfo;
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft data-icon="inline-start" aria-hidden />
          Previous
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

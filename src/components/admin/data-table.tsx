import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableCell, TableRow } from "@/components/ui/table";

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

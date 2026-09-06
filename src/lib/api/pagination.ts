import type { PageInfo, Paginated } from "@/types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Parses `page` / `pageSize` search params, clamped to sane bounds. */
export function parsePagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  const pageInfo: PageInfo = {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
  return { items, pageInfo };
}

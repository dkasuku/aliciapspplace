"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Client-side paging for admin tables. Resets to page 1 whenever the filtered
 * set changes, so narrowing a search never strands you on an empty page.
 */
export function usePagination<T>(items: T[], initialSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Clamp during render rather than resetting in an effect: filtering down to
  // fewer pages should never leave you staring at an empty table.
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const visible = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  return {
    visible,
    page: current,
    pageCount,
    pageSize,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
    setPage,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
  };
}

export type PaginationState = ReturnType<typeof usePagination>;

export function Pagination({
  state,
  label = "items",
}: {
  state: Omit<PaginationState, "visible">;
  label?: string;
}) {
  const { page, pageCount, pageSize, total, rangeStart, rangeEnd, setPage, setPageSize } = state;

  if (total === 0) return null;

  // Window of page numbers around the current page, so 40 pages don't wrap.
  const windowSize = 5;
  let first = Math.max(1, page - Math.floor(windowSize / 2));
  const last = Math.min(pageCount, first + windowSize - 1);
  first = Math.max(1, last - windowSize + 1);
  const numbers = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#166534]/15 px-4 py-3">
      <p className="text-xs text-[#64748b]">
        Showing <b className="text-[#0f172a]">{rangeStart}–{rangeEnd}</b> of {total} {label}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-[#64748b]">
          Rows
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="rounded-md border border-[#166534]/25 bg-white px-2 py-1 text-xs text-[#0f172a] focus:border-[#166534] focus:outline-none"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {first > 1 && <span className="px-1 text-xs text-[#94a3b8]">…</span>}
            {numbers.map((number) => (
              <Button
                key={number}
                variant={number === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(number)}
                aria-current={number === page ? "page" : undefined}
                className="min-w-9"
              >
                {number}
              </Button>
            ))}
            {last < pageCount && <span className="px-1 text-xs text-[#94a3b8]">…</span>}

            <Button
              variant="outline"
              size="sm"
              disabled={page === pageCount}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

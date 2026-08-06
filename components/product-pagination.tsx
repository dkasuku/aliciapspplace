"use client";

import { useMemo, useState } from "react";

export const STOREFRONT_PAGE_SIZE = 20;

/**
 * Paging for the storefront grids. Clamps during render so narrowing a filter
 * never strands a shopper on an empty page.
 */
export function useProductPaging<T>(items: T[], pageSize = STOREFRONT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const visible = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  return {
    visible,
    page: current,
    pageCount,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
    setPage,
  };
}

export function ProductPagination({
  state,
  scrollTo,
}: {
  state: Omit<ReturnType<typeof useProductPaging>, "visible">;
  /** Element id to jump back to, so page 2 does not start mid-grid. */
  scrollTo?: string;
}) {
  const { page, pageCount, total, rangeStart, rangeEnd, setPage } = state;
  if (total === 0) return null;

  const go = (next: number) => {
    setPage(next);
    if (scrollTo) document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const windowSize = 5;
  let first = Math.max(1, page - Math.floor(windowSize / 2));
  const last = Math.min(pageCount, first + windowSize - 1);
  first = Math.max(1, last - windowSize + 1);
  const numbers = Array.from({ length: last - first + 1 }, (_, i) => first + i);

  const cell =
    "min-w-10 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition disabled:opacity-40";

  return (
    <nav className="mt-10 flex flex-col items-center gap-4" aria-label="Product pages">
      <p className="text-xs text-[#587061]">
        Showing <b className="text-[#17251f]">{rangeStart}–{rangeEnd}</b> of {total} products
      </p>

      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={page === 1}
            className={`${cell} border-[#cfded2] bg-white text-[#456051] hover:border-[#147243]`}
          >
            ← Prev
          </button>

          {first > 1 && <span className="px-1 text-xs text-[#94a3b8]">…</span>}
          {numbers.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => go(number)}
              aria-current={number === page ? "page" : undefined}
              className={`${cell} ${
                number === page
                  ? "border-[#147243] bg-[#147243] text-white"
                  : "border-[#cfded2] bg-white text-[#456051] hover:border-[#147243]"
              }`}
            >
              {number}
            </button>
          ))}
          {last < pageCount && <span className="px-1 text-xs text-[#94a3b8]">…</span>}

          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page === pageCount}
            className={`${cell} border-[#cfded2] bg-white text-[#456051] hover:border-[#147243]`}
          >
            Next →
          </button>
        </div>
      )}
    </nav>
  );
}

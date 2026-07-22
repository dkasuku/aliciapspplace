"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function CartToast() {
  const { toast, cart } = useCart();
  if (!toast) return null;
  const count = cart.item_count ?? cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] animate-[fadeIn_0.2s_ease-out] sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl bg-[#0f172a] px-4 py-3.5 text-white shadow-2xl sm:px-5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#4ade80]">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="min-w-0 flex-1 text-sm font-bold">{toast}</span>
        {count > 0 && (
          <Link
            href="/cart"
            className="shrink-0 rounded-lg bg-[#147243] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[#0d5933] transition-colors"
          >
            View bag ({count})
          </Link>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

export function CartToast() {
  const { toast, cart } = useCart();
  if (!toast) return null;
  const count = cart.item_count ?? cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  return (
    <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center gap-3 rounded-2xl bg-[#0f172a] px-5 py-3.5 text-white shadow-2xl">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[#4ade80]">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="text-sm font-bold">{toast}</span>
        {count > 0 && (
          <Link
            href="/cart"
            className="ml-2 rounded-lg bg-[#147243] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-[#0d5933] transition-colors"
          >
            View bag ({count})
          </Link>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-provider";

export function FloatingCartButton() {
  const { cart } = useCart();
  const pathname = usePathname();
  const count = cart.item_count ?? cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const isCartOrCheckout = pathname === "/cart" || pathname.startsWith("/checkout");
  if (count === 0 || isCartOrCheckout) return null;
  const total = Number(cart.total || cart.subtotal || 0);

  return (
    <Link
      href="/cart"
      aria-label={`View bag with ${count} item${count === 1 ? "" : "s"}`}
      className="fixed bottom-4 left-4 z-[65] flex items-center gap-2 rounded-2xl bg-[#147243] px-4 py-3 text-white shadow-2xl transition-all hover:bg-[#0d5933] hover:scale-105 active:scale-95 sm:bottom-6 sm:left-6 sm:gap-3 sm:px-5 sm:py-4"
    >
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#fbbf24] px-1 text-[10px] font-black text-[#0f172a]">
          {count}
        </span>
      </div>
      <div className="hidden text-left sm:block">
        <p className="text-[9px] font-bold uppercase tracking-wider text-[#9de7ad]">View bag</p>
        <p className="text-sm font-black">KES {total.toLocaleString()}</p>
      </div>
    </Link>
  );
}

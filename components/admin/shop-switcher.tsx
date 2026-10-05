"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Building2 } from "lucide-react";
import type { Shop } from "@/lib/api/types";

/** Picks the shop the admin is working in. Every page follows the choice. */
export function ShopSwitcher({ shops, activeShopId }: { shops: Shop[]; activeShopId: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(shopId: string) {
    startTransition(async () => {
      await fetch("/api/admin/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shopId || null }),
      });
      router.refresh();
    });
  }

  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
        <Building2 className="h-3 w-3" /> Working in
      </span>
      <select
        value={activeShopId ?? ""}
        onChange={(e) => choose(e.target.value)}
        disabled={pending}
        className="mt-1 w-full rounded-lg border border-[#166534]/30 bg-white px-3 py-2 text-sm font-semibold text-[#166534] focus:border-[#166534] focus:outline-none disabled:opacity-60"
      >
        <option value="">All shops</option>
        {shops
          .filter((shop) => shop.is_active || shop.id === activeShopId)
          .map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
              {shop.is_main ? " (main)" : ""}
            </option>
          ))}
      </select>
    </label>
  );
}

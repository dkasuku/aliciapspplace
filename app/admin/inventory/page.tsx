import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { InventoryManager } from "@/components/admin/inventory-manager";
import type { InventoryItem, Shop } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const { headers, manager, shopId } = await adminContext();
  let items: InventoryItem[] = [];
  let shops: Shop[] = [];
  try {
    [items, shops] = await Promise.all([api.inventory.list(headers), api.shops(headers)]);
  } catch {}
  // In "All shops" every row is one shop's stock, so say which shop.
  const shopNames = shopId ? {} : Object.fromEntries(shops.map((s) => [s.id, s.name]));
  return <InventoryManager initialItems={items} canAdjust={manager} shopNames={shopNames} />;
}

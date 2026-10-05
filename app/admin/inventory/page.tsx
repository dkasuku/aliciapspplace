import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { InventoryManager } from "@/components/admin/inventory-manager";
import type { InventoryItem } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const { headers, manager } = await adminContext();
  let items: InventoryItem[] = [];
  try {
    items = await api.inventory.list(headers);
  } catch {}
  return <InventoryManager initialItems={items} canAdjust={manager} />;
}

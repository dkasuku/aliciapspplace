import { api } from "@/lib/api";
import { InventoryManager } from "@/components/admin/inventory-manager";
import { fallbackInventory } from "@/lib/catalog";
import type { InventoryItem } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  let items: InventoryItem[] = [];
  try {
    items = await api.inventory.list();
  } catch {}
  if (!items.length) items = fallbackInventory;
  return <InventoryManager initialItems={items} />;
}

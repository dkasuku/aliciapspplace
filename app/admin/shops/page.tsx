import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { ShopsManager } from "@/components/admin/shops-manager";
import type { Shop } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  const { headers } = await adminContext();
  let shops: Shop[] = [];
  try {
    shops = await api.shops(headers);
  } catch {}
  return <ShopsManager initialShops={shops} />;
}

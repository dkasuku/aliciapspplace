import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { POS } from "@/components/admin/pos";
import type { Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminPOSPage() {
  const { headers } = await adminContext();
  // No demo fallback here: a till must only ever sell real, in-shop products.
  let products: Product[] = [];
  try {
    products = await api.products.list({ status: "active", channel: "pos" }, headers);
  } catch {}
  return <POS initialProducts={products} />;
}

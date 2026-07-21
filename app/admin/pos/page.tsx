import { api } from "@/lib/api";
import { POS } from "@/components/admin/pos";
import { fallbackProducts } from "@/lib/catalog";
import type { Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminPOSPage() {
  let products: Product[] = [];
  try {
    products = await api.products.list({ status: "active" });
  } catch {}
  if (!products.length) products = fallbackProducts;
  return <POS initialProducts={products} />;
}

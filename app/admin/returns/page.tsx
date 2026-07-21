import { api } from "@/lib/api";
import { ReturnsManager } from "@/components/admin/returns-manager";
import { fallbackProducts } from "@/lib/catalog";
import type { Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  let products: Product[] = [];
  try {
    products = await api.products.list({ status: "active" });
  } catch {}
  if (!products.length) products = fallbackProducts;
  return <ReturnsManager initialReturns={[]} products={products} />;
}

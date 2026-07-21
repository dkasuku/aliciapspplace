import { api } from "@/lib/api";
import { RentalsManager } from "@/components/admin/rentals-manager";
import { fallbackProducts } from "@/lib/catalog";
import type { Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminRentalsPage() {
  let products: Product[] = [];
  try {
    products = await api.products.list({ status: "active" });
  } catch {}
  if (!products.length) products = fallbackProducts;
  return <RentalsManager initialRentals={[]} products={products} />;
}

import { api } from "@/lib/api";
import { RentalsManager } from "@/components/admin/rentals-manager";
import { fallbackProducts } from "@/lib/catalog";
import type { Product, RentalRecord } from "@/lib/api/types";

const API_URL = process.env.API_URL || "http://localhost:5000";

export const dynamic = "force-dynamic";

export default async function AdminRentalsPage() {
  let products: Product[] = [];
  try {
    products = await api.products.list({ status: "active" });
  } catch {}
  if (!products.length) products = fallbackProducts;

  let rentals: RentalRecord[] = [];
  try {
    const response = await fetch(`${API_URL}/api/rentals`, { cache: "no-store" });
    if (response.ok) rentals = (await response.json()) as RentalRecord[];
  } catch {
    // The manager surfaces the failure when it next talks to the API.
  }
  return <RentalsManager initialRentals={rentals} products={products} />;
}

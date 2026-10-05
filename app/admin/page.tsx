import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { Dashboard } from "@/components/admin/dashboard";
import { fallbackProducts, fallbackSales, fallbackStats } from "@/lib/catalog";
import type { Product, Sale, Stats } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { headers } = await adminContext();
  let stats: Stats = fallbackStats;
  let products: Product[] = fallbackProducts;
  let sales: Sale[] = fallbackSales;
  try {
    [stats, products, sales] = await Promise.all([
      api.stats(headers),
      api.products.list(undefined, headers),
      api.sales.list(headers),
    ]);
  } catch {}
  return <Dashboard stats={stats} products={products} sales={sales} />;
}

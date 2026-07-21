import { api } from "@/lib/api";
import { Dashboard } from "@/components/admin/dashboard";
import { fallbackProducts, fallbackSales, fallbackStats } from "@/lib/catalog";
import type { Product, Sale, Stats } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let stats: Stats | null = null;
  let products: Product[] = [];
  let sales: Sale[] = [];
  try {
    [stats, products, sales] = await Promise.all([
      api.stats(),
      api.products.list(),
      api.sales.list(),
    ]);
  } catch {}
  if (!products.length) products = fallbackProducts;
  if (!sales.length) sales = fallbackSales;
  if (!stats) stats = fallbackStats;
  return <Dashboard stats={stats} products={products} sales={sales} />;
}

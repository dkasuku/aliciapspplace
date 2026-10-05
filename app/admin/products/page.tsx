import { api } from "@/lib/api";
import { adminContext } from "@/lib/admin-session";
import { ProductsManager } from "@/components/admin/products-manager";
import { fallbackCategories } from "@/lib/catalog";
import type { Category, Product, Shop } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { headers, manager, shopId } = await adminContext();
  let products: Product[] = [];
  let categories: Category[] = [];
  let shops: Shop[] = [];
  try {
    [products, categories, shops] = await Promise.all([
      api.products.list(undefined, headers),
      api.categories.list(),
      api.shops(headers),
    ]);
  } catch {}
  if (!categories.length) categories = fallbackCategories;
  return <ProductsManager initialProducts={products} categories={categories} canManage={manager} shops={shops} activeShopId={shopId} />;
}

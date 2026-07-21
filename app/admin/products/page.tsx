import { api } from "@/lib/api";
import { ProductsManager } from "@/components/admin/products-manager";
import { fallbackCategories, fallbackProducts } from "@/lib/catalog";
import type { Category, Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products: Product[] = [];
  let categories: Category[] = [];
  try {
    [products, categories] = await Promise.all([
      api.products.list(),
      api.categories.list(),
    ]);
  } catch {}
  if (!products.length) products = fallbackProducts;
  if (!categories.length) categories = fallbackCategories;
  return <ProductsManager initialProducts={products} categories={categories} />;
}

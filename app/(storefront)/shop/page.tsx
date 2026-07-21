import { CatalogPage } from "@/components/catalog-page";
import { fallbackCategories, fallbackProducts } from "@/lib/catalog";
import { api } from "@/lib/api";
import type { Category, Product, StoreInfo } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let storeInfo: StoreInfo = { id: "alicia-phone-store", name: "Alicia Phone Store", currency: "KES" };
  let catalog: Product[] = [];
  let categories: Category[] = [];
  try {
    const [storeResult, productsResult, categoriesResult] = await Promise.allSettled([api.storeInfo(), api.products.list({ status: "active" }), api.categories.list()]);
    if (storeResult.status === "fulfilled") storeInfo = storeResult.value;
    if (productsResult.status === "fulfilled") catalog = productsResult.value;
    if (categoriesResult.status === "fulfilled") categories = categoriesResult.value;
  } catch {}
  return <CatalogPage store={storeInfo} products={catalog.length ? catalog : fallbackProducts} categories={categories.length ? categories : fallbackCategories} title="Shop all technology" intro="Browse our current collection of phones, audio, accessories and devices selected for everyday life." initialQuery={q} />;
}

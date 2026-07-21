import { Storefront } from "@/components/storefront";
import { api, ApiError } from "@/lib/api";
import type { Category, Product, StoreInfo } from "@/lib/api/types";
import { fallbackCategories, fallbackProducts } from "@/lib/catalog";
import { getSiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  let storeInfo: StoreInfo = { id: "alicia-phone-store", name: "Alicia Phone Store", description: "Premium phones, gadgets, and electronics delivered fast. Trusted tech, expert support, secure checkout.", currency: "KES" };
  let catalog: Product[] = [];
  let categories: Category[] = [];
  let setupMessage: string | null = null;

  try {
    const [storeResult, productsResult, categoriesResult] = await Promise.allSettled([
      api.storeInfo(),
      api.products.list({ status: "active" }),
      api.categories.list(),
    ]);
    if (storeResult.status === "fulfilled") storeInfo = storeResult.value;
    if (productsResult.status === "fulfilled") catalog = productsResult.value;
    if (categoriesResult.status === "fulfilled") categories = categoriesResult.value;
    const rejected = [storeResult, productsResult, categoriesResult].find((r) => r.status === "rejected");
    if (rejected?.status === "rejected") {
      setupMessage = rejected.reason instanceof ApiError ? rejected.reason.message : "The store API is temporarily unavailable.";
    }
  } catch (error) {
    setupMessage = error instanceof Error ? error.message : "Unable to load this store.";
  }

  const siteContent = await getSiteContent();
  const usingFallbackCatalog = catalog.length === 0;
  return <Storefront store={storeInfo} products={usingFallbackCatalog ? fallbackProducts : catalog} categories={categories.length > 0 ? categories : fallbackCategories} setupMessage={setupMessage} showingDemo={usingFallbackCatalog} siteContent={siteContent} />;
}

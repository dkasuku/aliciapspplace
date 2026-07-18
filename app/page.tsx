import { Storefront } from "@/components/storefront";
import { products, store, TopDukaApiError } from "@/lib/topduka";
import type { Category, Product, StoreInfo } from "@/lib/topduka";

export const dynamic = "force-dynamic";

const demoProducts: Product[] = [
  { id: "demo-1", name: "Everyday Carry Tote", price: 48, images: [] },
  { id: "demo-2", name: "Studio Pour-Over Set", price: 72, images: [] },
  { id: "demo-3", name: "Field Notes No. 04", price: 18, images: [] },
];

export default async function Home() {
  let storeInfo: StoreInfo = { name: "Your Store", description: "Independent goods, thoughtfully selected." };
  let catalog: Product[] = [];
  let categories: Category[] = [];
  let setupMessage: string | null = null;

  try {
    const [storeResult, configurationResult, productsResult, categoriesResult] = await Promise.allSettled([
      store.info(),
      store.configuration(),
      products.list({ status: "active", limit: 24 }),
      products.categories({ is_active: true }),
    ]);
    if (storeResult.status === "fulfilled") storeInfo = storeResult.value;
    if (configurationResult.status === "fulfilled") {
      storeInfo = { ...storeInfo, currency: configurationResult.value.currency_code || "USD" };
    }
    if (productsResult.status === "fulfilled") catalog = productsResult.value;
    if (categoriesResult.status === "fulfilled") categories = categoriesResult.value;
    const rejected = [storeResult, configurationResult, productsResult, categoriesResult].find((result) => result.status === "rejected");
    if (rejected?.status === "rejected") {
      setupMessage = rejected.reason instanceof TopDukaApiError ? rejected.reason.message : "The store API is temporarily unavailable.";
    }
  } catch (error) {
    setupMessage = error instanceof Error ? error.message : "Unable to load this store.";
  }

  return <Storefront store={storeInfo} products={catalog.length > 0 ? catalog : demoProducts} categories={categories} setupMessage={setupMessage} showingDemo={catalog.length === 0} />;
}

import { CatalogPage } from "@/components/catalog-page";
import { fallbackCategories, fallbackProducts } from "@/lib/catalog";
import { api } from "@/lib/api";
import type { Category, Product, StoreInfo } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const normalize = (value: string) => value.toLowerCase().replaceAll(" ", "-");

function prettifySlug(slug: string) {
  return slug.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let storeInfo: StoreInfo = { id: "alicia-phone-store", name: "Alicia Phone Store", currency: "KES" };
  let catalog: Product[] = [];
  let categories: Category[] = [];
  try {
    const [storeResult, productsResult, categoriesResult] = await Promise.allSettled([api.storeInfo(), api.products.list({ status: "active" }), api.categories.list()]);
    if (storeResult.status === "fulfilled") storeInfo = storeResult.value;
    if (productsResult.status === "fulfilled") catalog = productsResult.value;
    if (categoriesResult.status === "fulfilled") categories = categoriesResult.value;
  } catch {}
  const productList = catalog.length ? catalog : fallbackProducts;
  const categoryList = categories.length ? categories : fallbackCategories;
  const category = categoryList.find((item) => normalize(item.slug || item.name) === slug);

  if (category) {
    return <CatalogPage store={storeInfo} products={productList} categories={categoryList} activeCategory={category.name} title={category.name} intro={category.description || `Explore our hand-picked ${category.name.toLowerCase()} collection.`} />;
  }

  const searchTerms = slug.split("-").filter((term) => term.length > 2);
  const matchedProducts = productList.filter((p) => {
    const haystack = `${p.name} ${p.description || ""} ${(p.categories || []).join(" ")}`.toLowerCase();
    return searchTerms.some((term) => haystack.includes(term));
  });

  const title = prettifySlug(slug);
  return <CatalogPage store={storeInfo} products={matchedProducts.length ? matchedProducts : productList} categories={categoryList} title={title} intro={`Browse our ${title.toLowerCase()} collection — phones, accessories and more selected for you.`} />;
}

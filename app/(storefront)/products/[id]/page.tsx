import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { api } from "@/lib/api";
import { findFallbackProduct, fallbackProducts } from "@/lib/catalog";
import type { Product } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product = findFallbackProduct(id);
  let currency = product?.currency || "KES";
  let relatedProducts: Product[] = [];
  try {
    const [apiProduct, storeInfo] = await Promise.all([api.products.get(id), api.storeInfo()]);
    product = apiProduct;
    currency = storeInfo.currency || product?.currency || "KES";
    const category = product?.categories?.[0];
    if (category) {
      const all = await api.products.list({ status: "active", category });
      relatedProducts = all.filter((p) => p.id !== product!.id).slice(0, 4);
    }
    if (relatedProducts.length === 0) {
      const all = await api.products.list({ status: "active" });
      relatedProducts = all.filter((p) => p.id !== product!.id).slice(0, 4);
    }
  } catch {
    if (product) {
      relatedProducts = fallbackProducts.filter((p) => p.id !== product!.id && p.categories?.some((c) => product!.categories?.includes(c))).slice(0, 4);
      if (relatedProducts.length === 0) {
        relatedProducts = fallbackProducts.filter((p) => p.id !== product!.id).slice(0, 4);
      }
    }
  }
  if (!product) notFound();
  return <ProductDetail product={product} currency={currency} relatedProducts={relatedProducts} />;
}

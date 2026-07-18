import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { products, store } from "@/lib/topduka";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [catalog, configuration] = await Promise.all([products.list({ id }), store.configuration()]);
  const product = catalog[0];
  if (!product) notFound();
  return <ProductDetail product={product} currency={configuration.currency_code || product.currency || "USD"}/>;
}

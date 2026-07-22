"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product, StoreInfo } from "@/lib/api/types";
import { useCart } from "./cart-provider";

type Props = { store: StoreInfo; products: Product[]; categories: Category[]; title: string; intro: string; activeCategory?: string; initialQuery?: string };
const money = (value: number | string | null | undefined, currency: string) => new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));

export function CatalogPage({ store, products, categories, title, intro, activeCategory = "all", initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const { loading, update } = useCart();
  const currency = store.currency || products[0]?.currency || "KES";
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === "all" || product.categories?.includes(activeCategory);
    return matchesCategory && `${product.name} ${product.description || ""}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [activeCategory, products, query]);
  const add = async (product: Product) => { await update(product.id, 1, { name: product.name, price: product.price, sales_price: product.sales_price, images: product.images }); };

  return <main className="min-h-screen bg-[#f7f8f5] text-[#17251f]">
    <div className="mx-auto max-w-7xl px-5 pt-5">
      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">
        <Link href="/" className="hover:text-[#14532d]">← Home</Link>
        <span className="text-[#cbd5e1]">/</span>
        <Link href="/shop" className="hover:text-[#14532d]">Shop all</Link>
        <span className="text-[#cbd5e1]">/</span>
        <span className="text-[#5c7564]">{title}</span>
      </div>
    </div>
    <section className="border-b border-[#dbe5dc] bg-[#e9f7ec]"><div className="mx-auto max-w-7xl px-5 py-12"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#18864e]">Alicia collection</p><h1 className="mt-3 font-display text-4xl font-black tracking-[-0.06em] text-[#123625] sm:text-5xl">{title}</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#466451]">{intro}</p></div></section>
    <section className="mx-auto max-w-7xl px-5 py-10"><div className="flex flex-col gap-4 border-b border-[#d9e4dc] pb-5 md:flex-row md:items-center md:justify-between"><div className="flex gap-2 overflow-x-auto">{categories.map((category) => <Link key={category.id} href={`/categories/${encodeURIComponent(category.slug || category.name.toLowerCase().replaceAll(" ", "-"))}`} className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${activeCategory === category.name ? "bg-[#147243] text-white" : "border border-[#cfded2] bg-white text-[#456051] hover:border-[#147243]"}`}>{category.name}</Link>)}</div><label className="flex max-w-sm overflow-hidden rounded-xl border border-[#cfdbd1] bg-white focus-within:border-[#147243]"><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 px-4 py-2.5 text-sm outline-none" placeholder="Search this collection"/><span className="bg-[#147243] px-4 py-2.5 text-xs font-bold text-white">Search</span></label></div>
      <p className="mt-5 text-xs text-[#5c7564]">{visibleProducts.length} product{visibleProducts.length === 1 ? "" : "s"} available</p>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{visibleProducts.map((product) => <article key={product.id} className="group"><Link href={`/products/${product.id}`} className="block"><div className="relative aspect-square overflow-hidden rounded-2xl border border-[#dce6de] bg-white p-4"><img src={product.images?.[0] || "/Phoneplacelg.png"} alt={product.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/Phoneplacelg.png"; }} className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"/>{product.product_type === "rental" ? <span className="absolute left-3 top-3 rounded-full bg-[#fbbf24] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#78350f]">Lipa Pole Pole</span> : <span className="absolute left-3 top-3 rounded-full bg-[#dcf6e1] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#147243]">In stock</span>}</div><h2 className="mt-3 min-h-10 text-xs font-bold leading-5 text-[#233d2c] group-hover:text-[#147243]">{product.name}</h2><p className="mt-1 font-display text-base font-black text-[#147243]">{money(product.sales_price ?? product.price, currency)}</p>{product.product_type === "rental" && product.rental_terms && <p className="mt-0.5 text-[10px] font-medium text-[#92400e]">{product.rental_terms}</p>}</Link><button disabled={loading} onClick={() => void add(product)} className="mt-3 w-full rounded-xl border border-[#147243] py-2.5 text-[10px] font-black uppercase tracking-wider text-[#147243] hover:bg-[#147243] hover:text-white disabled:opacity-40">{product.product_type === "rental" ? "Apply now" : "Add to bag"}</button></article>)}</div>
      {!visibleProducts.length && <div className="mt-8 rounded-2xl border border-dashed border-[#b8cbbb] bg-white py-16 text-center text-sm text-[#587061]">No products match that search.</div>}</section>
  </main>;
}

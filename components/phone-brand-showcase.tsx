"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/api/types";

type Brand = "Samsung" | "iPhone" | "Tecno";
const brands: Brand[] = ["Samsung", "iPhone", "Tecno"];
const keywords: Record<Brand, string[]> = { Samsung: ["samsung"], iPhone: ["iphone", "apple iphone"], Tecno: ["tecno"] };

export function PhoneBrandShowcase({ products, currency }: { products: Product[]; currency: string }) {
  const [activeBrand, setActiveBrand] = useState<Brand>("Samsung");
  const brandProducts = useMemo(() => products.filter((product) => product.categories?.includes("Smartphones") && keywords[activeBrand].some((keyword) => product.name.toLowerCase().includes(keyword))).slice(0, 3), [activeBrand, products]);
  const money = (value: number | string | null | undefined) => new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));

  return <section className="mx-auto max-w-7xl px-5 py-7"><div className="rounded-3xl border border-[#d6e7d9] bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-5 border-b border-[#e2ece4] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#18864e]">Shop by phone brand</p><h2 className="mt-1 font-display text-2xl font-black tracking-[-0.05em] text-[#173d26]">Your next phone, your way</h2><p className="mt-2 text-sm text-[#63806c]">Explore the latest favourites from the brands you know.</p></div><div className="flex gap-2">{brands.map((brand) => <button key={brand} onClick={() => setActiveBrand(brand)} className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider transition ${activeBrand === brand ? "bg-[#147243] text-white shadow-md" : "border border-[#cfded2] text-[#456051] hover:border-[#147243]"}`}>{brand}</button>)}</div></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{brandProducts.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group flex min-h-44 items-center gap-4 rounded-2xl bg-[#f3f8f4] p-4 transition hover:-translate-y-1 hover:bg-[#e8f5ea] hover:shadow-md"><div className="grid h-28 w-24 shrink-0 place-items-center rounded-xl bg-white p-2"><img src={product.images?.[0] || "/Phoneplacelg.png"} alt={product.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/Phoneplacelg.png"; }} className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-110"/></div><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#18864e]">{activeBrand} pick</p><h3 className="mt-2 text-sm font-bold leading-5 text-[#1b3b29]">{product.name}</h3><p className="mt-3 font-display text-base font-black text-[#147243]">{money(product.sales_price ?? product.price)}</p><span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-[#285f39]">View details →</span></div></Link>)}</div>{!brandProducts.length && <p className="py-12 text-center text-sm text-[#63806c]">More {activeBrand} phones are arriving soon.</p>}</div></section>;
}

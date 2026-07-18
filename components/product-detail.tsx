"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/topduka";
import { useCart } from "./cart-provider";

export function ProductDetail({ product, currency }: { product: Product; currency: string }) {
  const { update, setOpen, loading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const price = Number(product.sales_price ?? product.price);
  const money = new Intl.NumberFormat("en", { style: "currency", currency }).format(price);
  return <main className="min-h-screen"><header className="border-b border-[#171811] px-5 py-5"><div className="mx-auto flex max-w-6xl justify-between"><Link href="/" className="font-display text-2xl font-black">TopDuka<span className="text-[#ec4b24]">.</span></Link><button onClick={()=>setOpen(true)} className="text-xs font-bold uppercase tracking-wider">Open bag</button></div></header><div className="mx-auto grid max-w-6xl border-x border-[#171811]/20 lg:grid-cols-2"><div className="min-h-[520px] bg-[#ded7ca] p-6 md:p-12">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full max-h-[720px] w-full object-contain"/> : <div className="flex h-full min-h-[500px] items-center justify-center font-display text-9xl font-black text-[#171811]/10">01</div>}</div><section className="flex flex-col justify-center px-6 py-14 md:px-14"><Link href="/#catalog" className="mb-12 text-[10px] font-bold uppercase tracking-[0.2em]">← Back to catalog</Link><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ec4b24]">{product.categories?.[0] || "The collection"}</p><h1 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">{product.name}</h1><p className="mt-7 text-2xl font-black">{money}</p><p className="mt-7 max-w-xl leading-7 text-[#171811]/65">{product.description || "A carefully selected item from this store."}</p><div className="mt-10 flex gap-3"><div className="flex border border-[#171811]"><button type="button" onClick={()=>setQuantity(Math.max(1,quantity-1))} className="px-4">−</button><span className="border-x border-[#171811] px-5 py-4">{quantity}</span><button type="button" onClick={()=>setQuantity(quantity+1)} className="px-4">+</button></div><button disabled={loading} onClick={async()=>{await update(product.id,quantity);setOpen(true);}} className="flex-1 bg-[#ec4b24] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] disabled:opacity-50">Add to bag</button></div></section></div></main>;
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Product, StoreInfo } from "@/lib/topduka/types";
import { AgentPanel } from "./agent-panel";
import { useCart } from "./cart-provider";

interface StorefrontProps {
  store: StoreInfo;
  products: Product[];
  categories: Category[];
  setupMessage: string | null;
  showingDemo: boolean;
}

function money(value: number | string, currency = "USD") {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount || 0);
}

export function Storefront({ store, products, categories, setupMessage, showingDemo }: StorefrontProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const { cart, setOpen, update, loading: cartLoading } = useCart();
  const storeName = store.name || "Your Store";
  const currency = store.currency || "USD";
  const cartCount = cart.item_count ?? cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  const visibleProducts = useMemo(
    () => activeCategory === "all" ? products : products.filter((product) => product.categories?.includes(activeCategory)),
    [activeCategory, products],
  );

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="border-b border-[#171811]/20 bg-[#d9ff43] px-5 py-2 text-center text-[11px] font-bold uppercase tracking-[0.22em]">
        Server-rendered storefront · Secure API access · Built for independent commerce
      </div>
      <header className="mx-auto flex max-w-[1440px] items-center justify-between border-x border-[#171811]/20 px-5 py-5 md:px-10">
        <a href="#top" className="font-display text-2xl font-black tracking-[-0.05em] md:text-3xl">{storeName}<span className="text-[#ec4b24]">.</span></a>
        <nav className="hidden items-center gap-8 text-xs font-bold uppercase tracking-[0.16em] md:flex">
          <a className="hover:text-[#ec4b24]" href="#catalog">Shop</a>
          <a className="hover:text-[#ec4b24]" href="#story">Our story</a>
          <a className="hover:text-[#ec4b24]" href="#help">Help</a>
        </nav>
        <button onClick={() => setOpen(true)} className="border border-[#171811] bg-[#171811] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#f4f0e8] transition-transform hover:-translate-y-0.5" type="button" aria-label={`Cart with ${cartCount} items`}>
          Bag [{String(cartCount).padStart(2, "0")}]
        </button>
      </header>

      {setupMessage && (
        <section className="mx-auto max-w-[1440px] border border-[#171811] bg-[#fff8dc] px-5 py-4 text-sm md:px-10">
          <strong className="mr-2 uppercase tracking-wider">Setup note:</strong>{setupMessage} {showingDemo && "Preview products are shown until the API is connected."}
        </section>
      )}

      <section id="top" className="mx-auto grid max-w-[1440px] border-x border-b border-[#171811]/20 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex min-h-[560px] flex-col justify-between px-5 py-12 md:px-10 md:py-16 lg:min-h-[690px]">
          <span className="w-fit border border-[#171811] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]">New season · Edition 01</span>
          <div>
            <p className="mb-5 max-w-xl text-sm uppercase tracking-[0.2em] text-[#171811]/60">Objects that earn their place</p>
            <h1 className="font-display max-w-5xl text-[clamp(4.2rem,10vw,9.5rem)] font-black leading-[0.78] tracking-[-0.075em]">Buy less.<br /><span className="italic text-[#ec4b24]">Choose</span> well.</h1>
          </div>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <p className="max-w-sm text-base leading-7 text-[#171811]/70">{store.description || "A considered collection made for daily rituals, long weekends, and everything between."}</p>
            <a href="#catalog" className="border-b-2 border-[#171811] pb-1 text-xs font-bold uppercase tracking-[0.18em]">Explore the collection ↓</a>
          </div>
        </div>
        <div className="relative min-h-[460px] overflow-hidden bg-[#ec4b24] p-5 md:p-10 lg:min-h-full">
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full border-[42px] border-[#d9ff43] md:h-96 md:w-96" />
          <div className="absolute bottom-20 left-10 h-44 w-44 rotate-12 bg-[#171811] shadow-[18px_18px_0_#f4f0e8] md:h-60 md:w-60" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <p className="max-w-[15rem] font-display text-3xl font-bold leading-tight text-[#f4f0e8]">Good design should feel obvious after you meet it.</p>
            <span className="self-end text-[10px] font-bold uppercase tracking-[0.25em]">Curated / Useful / Enduring</span>
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-[1440px] border-x border-[#171811]/20 px-5 py-20 md:px-10 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-7 border-b border-[#171811] pb-7 md:flex-row md:items-end">
          <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#ec4b24]">The current edit</p><h2 className="font-display text-5xl font-black tracking-[-0.055em] md:text-7xl">Shop the shelf</h2></div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            <FilterButton active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>All</FilterButton>
            {categories.map((category) => <FilterButton key={category.id} active={activeCategory === category.name} onClick={() => setActiveCategory(category.name)}>{category.name}</FilterButton>)}
          </div>
        </div>

        <div className="grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product, index) => {
            const image = product.images?.[0];
            const price = product.sales_price ?? product.price;
            const background = index % 3 === 1 ? "bg-[#d9ff43]" : index % 3 === 2 ? "bg-[#ec4b24]" : "bg-[#ded7ca]";
            return (
              <article key={product.id} className="group">
                <div className={`relative mb-5 aspect-[4/5] overflow-hidden border border-[#171811]/20 ${background}`}>
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : <div className="flex h-full items-center justify-center font-display text-[8rem] font-black text-[#171811]/10">{String(index + 1).padStart(2, "0")}</div>}
                  <span className="absolute left-3 top-3 bg-[#f4f0e8] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em]">In the edit</span>
                  <button disabled={cartLoading || product.id.startsWith("demo-")} type="button" onClick={async () => { await update(product.id, 1); setOpen(true); }} className="absolute bottom-3 right-3 translate-y-16 bg-[#171811] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-transform group-hover:translate-y-0 focus:translate-y-0 disabled:opacity-50">Add to bag +</button>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div><Link href={`/products/${product.id}`} className="font-display text-2xl font-bold tracking-[-0.025em] hover:text-[#ec4b24]">{product.name}</Link><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#171811]/55">{product.description || "Made for daily use and designed to last."}</p></div>
                  <span className="shrink-0 text-sm font-bold">{money(price, currency)}</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="story" className="border-y border-[#171811] bg-[#171811] text-[#f4f0e8]">
        <div className="mx-auto grid max-w-[1440px] md:grid-cols-3">
          {[["01", "Chosen with intent", "Every item has a reason to be here."], ["02", "Secure by default", "Your store API key never reaches the browser."], ["03", "Ready to grow", "Swap the styling, keep the complete API client."]].map(([number, title, copy]) => (
            <div key={number} className="border-b border-white/20 p-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 md:p-10"><span className="text-xs font-bold text-[#d9ff43]">{number}</span><h3 className="mt-16 font-display text-3xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/55">{copy}</p></div>
          ))}
        </div>
      </section>

      <footer id="help" className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 border-x border-[#171811]/20 px-5 py-12 md:flex-row md:items-end md:px-10">
        <div><p className="font-display text-4xl font-black tracking-[-0.05em]">{storeName}<span className="text-[#ec4b24]">.</span></p><p className="mt-3 text-sm text-[#171811]/60">Powered by TopDuka. Deploy anywhere Node.js runs.</p></div>
        <div className="text-xs font-bold uppercase tracking-[0.15em]">© {new Date().getFullYear()} · All goods, good.</div>
      </footer>
      <AgentPanel storeName={storeName} />
    </main>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`shrink-0 border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] ${active ? "border-[#171811] bg-[#171811] text-white" : "border-[#171811]/30"}`}>{children}</button>;
}

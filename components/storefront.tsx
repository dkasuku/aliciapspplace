"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product, StoreInfo } from "@/lib/api/types";
import type { SiteContent } from "@/lib/site-content";
import { FeaturedProducts } from "./featured-products";
import { MotionBanner } from "./motion-banner";
import { PhoneBrandShowcase } from "./phone-brand-showcase";
import { useCart } from "./cart-provider";

type Props = { store: StoreInfo; products: Product[]; categories: Category[]; setupMessage: string | null; showingDemo: boolean; siteContent?: SiteContent };
const money = (value: number | string | null | undefined, currency: string) => new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
const categoryGlyphs: Record<string, string> = { Smartphones: "▣", Audio: "◖", Wearables: "◉", Accessories: "⌁", Laptops: "▰", Gaming: "✦" };

export function Storefront({ store, products, categories, setupMessage, showingDemo, siteContent }: Props) {
  const [activeCategory, setActiveCategory] = useState("all");
  const { update, loading } = useCart();
  const currency = store.currency || products[0]?.currency || "KES";
  const storeName = store.name && store.name !== "Your Store" ? store.name : "Alicia Phone Store";
  const categoryNames = useMemo(() => categories.map((category) => category.name), [categories]);
  const visibleProducts = useMemo(() => products.filter((product) => activeCategory === "all" || product.categories?.includes(activeCategory)), [activeCategory, products]);
  const scrollToCatalog = () => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  const chooseCategory = (category: string) => { setActiveCategory(category); scrollToCatalog(); };
  const add = async (product: Product) => { await update(product.id, 1, { name: product.name, price: product.price, sales_price: product.sales_price, images: product.images }); };

  return <main id="top" className="min-h-screen bg-[#f7f8f5] text-[#17251f]">
    {setupMessage && <div className="mx-auto max-w-7xl px-5 pt-4"><div className="rounded-lg border border-[#9ed6aa] bg-[#effaf0] px-4 py-3 text-xs text-[#135c32]">{showingDemo ? "Showing the curated Alicia collection while your live inventory connects. " : ""}{setupMessage}</div></div>}
    <section className="mx-auto grid max-w-7xl gap-4 px-5 py-6 lg:grid-cols-[1fr_300px]"><div className="relative overflow-hidden rounded-3xl bg-[#0c2a1c] px-7 py-12 text-white shadow-xl sm:px-12"><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[40px] border-[#48bb78]/25"/><div className="absolute bottom-[-110px] left-[38%] h-72 w-72 rounded-full bg-[#147243]/45 blur-2xl"/><div className="relative grid gap-8 md:grid-cols-[1fr_260px] md:items-center"><div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9de7ad]">{siteContent?.heroSection?.badge || "The Alicia Promo"}</p><h1 className="mt-4 max-w-xl font-display text-4xl font-black leading-[1.04] tracking-[-0.06em] sm:text-6xl">{siteContent?.heroSection?.title || "Technology that feels like yours."}</h1><p className="mt-5 max-w-md text-sm leading-6 text-[#d6e9db]">{siteContent?.heroSection?.subtitle || "Real products from the brands you know. Thoughtfully selected, clearly priced and ready to deliver."}</p><div className="mt-8 flex flex-wrap gap-3"><Link href={products[0] ? `/products/${products[0].id}` : "#catalog"} className="rounded-xl bg-[#d2f6d6] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#0b3b20] hover:bg-white">{siteContent?.heroSection?.ctaPrimary || "Shop featured"}</Link><button onClick={scrollToCatalog} type="button" className="rounded-xl border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-wider hover:bg-white/10">{siteContent?.heroSection?.ctaSecondary || "Browse collection"}</button></div></div><div className="relative mx-auto h-64 w-48 rotate-[8deg] rounded-[2.4rem] border-[7px] border-[#0b130e] bg-gradient-to-br from-[#d4f6dc] via-[#91d6ae] to-[#1f9160] shadow-2xl">{siteContent?.heroSection?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={siteContent.heroSection.imageUrl} alt="Hero" className="h-full w-full rounded-[1.8rem] object-cover" />
                    ) : (
                      <div className="absolute left-4 top-4 h-14 w-14 rounded-2xl bg-[#102a1d]/80 p-2"><i className="block h-3 w-3 rounded-full bg-[#a5e5b7]"/><i className="mt-2 block h-3 w-3 rounded-full bg-[#a5e5b7]"/></div>
                    )}</div></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">{(siteContent?.promoCards?.filter((p) => p.enabled).length ? siteContent.promoCards.filter((p) => p.enabled) : [{ id: "d1", title: "Gaming, upgraded", detail: "Headsets, controllers & more", tone: "from-[#22103c] to-[#833c9e]", category: "Gaming", enabled: true }, { id: "d2", title: "Sound without limits", detail: "Your next favorite listen", tone: "from-[#783111] to-[#d76c25]", category: "Audio", enabled: true }]).map((promo) => <Promo key={promo.id} title={promo.title} detail={promo.detail} tone={promo.tone} imageUrl={promo.imageUrl} onClick={() => chooseCategory(promo.category)}/>)}</div></section>
    <FeaturedProducts products={products} currency={currency} />
    <PhoneBrandShowcase products={products} currency={currency} />
    <section className="mx-auto max-w-7xl px-5 py-5"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#18864e]">Explore by need</p><h2 className="mt-1 font-display text-2xl font-black tracking-[-0.05em]">Start with a category</h2></div><button onClick={() => chooseCategory("all")} className="text-xs font-bold text-[#147243] hover:underline">View all</button></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categoryNames.map((name) => <button key={name} onClick={() => chooseCategory(name)} className="group rounded-2xl border border-[#dbe6dd] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#76c88c] hover:shadow-md"><span className="font-display text-2xl text-[#147243]">{categoryGlyphs[name] || "✦"}</span><span className="mt-6 block text-xs font-bold text-[#1b3b29]">{name}</span></button>)}</div></section>
    <section id="catalog" className="mx-auto max-w-7xl px-5 py-10"><div className="flex flex-col gap-4 border-b border-[#d9e4dc] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#18864e]">Curated collection</p><h2 className="mt-1 font-display text-3xl font-black tracking-[-0.06em]">{activeCategory === "all" ? "Trending now" : activeCategory}</h2></div><div className="flex gap-2 overflow-x-auto">{["all", ...categoryNames.slice(0, 4)].map((name) => <button key={name} onClick={() => setActiveCategory(name)} className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${activeCategory === name ? "bg-[#147243] text-white" : "border border-[#cfded2] bg-white text-[#456051] hover:border-[#147243]"}`}>{name === "all" ? "All products" : name}</button>)}</div></div>
      {visibleProducts.length ? <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} currency={currency} loading={loading} onAdd={() => void add(product)}/>)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-[#b8cbbb] bg-white py-16 text-center text-sm text-[#587061]">No products match that search. Try another term or category.</div>}</section>

    {/* Phone sections: All / For Sale / Lipa Pole Pole */}
    <PhoneSections products={products} currency={currency} loading={loading} onAdd={add} />
    <MotionBanner siteContent={siteContent} />
    <section id="help" className="bg-[#0d2118] text-[#dff4e2]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3"><div>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={siteContent?.logoUrl || "/Phoneplacelg.png"} alt="Alicia Phone Store" className="h-24 w-auto max-w-[300px] object-contain brightness-0 invert" /><p className="mt-3 max-w-xs text-sm leading-6 text-[#b7d8bd]">{siteContent?.footer?.description || "Premium phones and practical technology for every day in Kenya."}</p></div><div><h3 className="text-xs font-bold uppercase tracking-wider text-white">Shop with confidence</h3><p className="mt-3 text-sm leading-7 text-[#b7d8bd]">{siteContent?.footer?.shopWithConfidence || "Secure checkout · Verified products · Fast delivery"}</p></div><div><h3 className="text-xs font-bold uppercase tracking-wider text-white">Customer care</h3><a href={`tel:${(siteContent?.footer?.phone || "+254724126009").replace(/\s/g, "")}`} className="mt-3 block text-sm text-[#b7d8bd] hover:text-white">{siteContent?.footer?.phone || "+254 724 126 009"}</a><a href={`mailto:${siteContent?.footer?.email || "aliciaphoneplaceke@gmail.com"}`} className="mt-2 block text-sm text-[#b7d8bd] hover:text-white">{siteContent?.footer?.email || "aliciaphoneplaceke@gmail.com"}</a></div></div><div className="border-t border-white/10 py-4 text-center text-[10px] text-[#8eb798]"><div className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1"><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link><Link href="/terms" className="hover:text-white">Terms &amp; Conditions</Link></div>© {new Date().getFullYear()} {storeName}. All rights reserved.</div></section>
  </main>;
}

function Promo({ title, detail, tone, imageUrl, onClick }: { title: string; detail: string; tone: string; imageUrl?: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={`relative min-h-40 overflow-hidden rounded-3xl bg-gradient-to-br ${tone} p-6 text-left text-white shadow-lg transition hover:scale-[1.02]`}>{imageUrl ? (<>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={imageUrl} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-50"/><div className={`absolute inset-0 bg-gradient-to-br ${tone} opacity-40`}/></>) : <span className="absolute -right-5 -top-5 h-28 w-28 rounded-full border-[18px] border-white/20"/>}<span className="relative block text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">Explore the edit</span><strong className="relative mt-5 block font-display text-2xl font-black tracking-[-0.05em]">{title}</strong><span className="relative mt-2 block text-xs text-white/80">{detail} →</span></button>; }
function ProductCard({ product, currency, loading, onAdd }: { product: Product; currency: string; loading: boolean; onAdd: () => void }) { const price = product.sales_price ?? product.price; const isRental = product.product_type === "rental"; return <article className="group"><Link href={`/products/${product.id}`} className="block"><div className="relative aspect-square overflow-hidden rounded-2xl border border-[#dce6de] bg-white p-4"><img src={product.images?.[0] || "/Phoneplacelg.png"} alt={product.name} className="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105"/>{isRental ? <span className="absolute left-3 top-3 rounded-full bg-[#fbbf24] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#78350f]">Lipa Pole Pole</span> : <span className="absolute left-3 top-3 rounded-full bg-[#dcf6e1] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#147243]">In stock</span>}</div><h3 className="mt-3 min-h-10 text-xs font-bold leading-5 text-[#233d2c] group-hover:text-[#147243]">{product.name}</h3><p className="mt-1 font-display text-base font-black text-[#147243]">{money(price, currency)}</p>{product.sales_price && <p className="text-[10px] text-[#728579] line-through">{money(product.price, currency)}</p>}</Link><button disabled={loading} onClick={onAdd} className="mt-3 w-full rounded-xl border border-[#147243] py-2.5 text-[10px] font-black uppercase tracking-wider text-[#147243] hover:bg-[#147243] hover:text-white disabled:opacity-40">Add to bag</button></article>; }

const PHONE_CATEGORY_KEYWORDS = ["smartphone", "phone", "samsung", "apple", "iphone", "tecno", "pixel", "mobile"];

function isPhoneProduct(product: Product): boolean {
  const cats = (product.categories || []).join(" ").toLowerCase();
  const name = (product.name || "").toLowerCase();
  return PHONE_CATEGORY_KEYWORDS.some((kw) => cats.includes(kw) || name.includes(kw));
}

function PhoneSections({ products, currency, loading, onAdd }: { products: Product[]; currency: string; loading: boolean; onAdd: (p: Product) => void }) {
  const [phoneTab, setPhoneTab] = useState<"all" | "sale" | "rental">("all");

  const allPhones = useMemo(() => products.filter(isPhoneProduct), [products]);
  const salePhones = useMemo(() => allPhones.filter((p) => p.product_type !== "rental"), [allPhones]);
  const rentalPhones = useMemo(() => allPhones.filter((p) => p.product_type === "rental"), [allPhones]);

  const tabProducts = phoneTab === "all" ? allPhones : phoneTab === "sale" ? salePhones : rentalPhones;
  const tabLabel = phoneTab === "all" ? "All Phones" : phoneTab === "sale" ? "Phones for Sale" : "Lipa Pole Pole";

  if (!allPhones.length) return null;

  const tabs: { key: typeof phoneTab; label: string; count: number; badge?: string }[] = [
    { key: "all", label: "All Phones", count: allPhones.length },
    { key: "sale", label: "For Sale", count: salePhones.length },
    { key: "rental", label: "Lipa Pole Pole", count: rentalPhones.length, badge: "rental" },
  ];

  return (
    <section id="phones" className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-col gap-4 border-b border-[#d9e4dc] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#18864e]">Phone collection</p>
          <h2 className="mt-1 font-display text-3xl font-black tracking-[-0.06em]">{tabLabel}</h2>
          <p className="mt-2 text-sm text-[#5c7564]">
            {phoneTab === "rental"
              ? "Pay slowly with our Lipa Pole Pole installment plans. Apply directly on the product page."
              : phoneTab === "sale"
              ? "Buy outright — genuine phones ready for immediate purchase and delivery."
              : "Browse all phones — available for sale or through Lipa Pole Pole installment plans."}
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPhoneTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                phoneTab === tab.key
                  ? tab.badge === "rental"
                    ? "bg-[#fbbf24] text-[#78350f]"
                    : "bg-[#147243] text-white"
                  : "border border-[#cfded2] bg-white text-[#456051] hover:border-[#147243]"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] ${phoneTab === tab.key ? "bg-white/20" : "bg-[#f0fdf4]"}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {tabProducts.length ? (
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tabProducts.map((product) => (
            <ProductCard key={product.id} product={product} currency={currency} loading={loading} onAdd={() => void onAdd(product)} />
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed border-[#b8cbbb] bg-white py-16 text-center text-sm text-[#587061]">
          {phoneTab === "rental"
            ? "No Lipa Pole Pole phones available right now. Check back soon or contact us at +254 724 126 009."
            : "No phones available in this category right now."}
        </div>
      )}

      {phoneTab === "rental" && rentalPhones.length > 0 && (
        <div className="mt-8 rounded-2xl border border-[#fbbf24]/30 bg-[#fffbeb] p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#92400e]">How Lipa Pole Pole works</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#fbbf24] text-xs font-black text-[#78350f]">1</span>
              <p className="text-xs leading-5 text-[#78350f]">Browse rental phones and click "Apply for Lipa Pole Pole" on the product page.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#fbbf24] text-xs font-black text-[#78350f]">2</span>
              <p className="text-xs leading-5 text-[#78350f]">Provide your ID, contact details and choose a payment plan that works for you.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#fbbf24] text-xs font-black text-[#78350f]">3</span>
              <p className="text-xs leading-5 text-[#78350f]">Pay a small fixed amount daily until you own the phone.</p>
            </div>
          </div>
          <a href="tel:+254724126009" className="mt-4 inline-block rounded-xl bg-[#fbbf24] px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#78350f] hover:bg-[#f59e0b]">Call us to learn more →</a>
        </div>
      )}
    </section>
  );
}

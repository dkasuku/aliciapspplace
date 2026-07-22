"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/api/types";
import { useCart } from "./cart-provider";

const PHONE_COLORS = [
  { name: "Titanium Black", hex: "#1a1a1a" },
  { name: "Titanium Gray", hex: "#5a5a5a" },
  { name: "Titanium White", hex: "#e8e8e8" },
  { name: "Titanium Blue", hex: "#2b3a67" },
  { name: "Desert Titanium", hex: "#b8956a" },
];

const AUDIO_COLORS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#e8e8e8" },
  { name: "Midnight Blue", hex: "#1a2744" },
  { name: "Sand", hex: "#c4a98a" },
];

const TABLET_COLORS = [
  { name: "Space Gray", hex: "#4a4a4a" },
  { name: "Silver", hex: "#d4d4d4" },
  { name: "Starlight", hex: "#f0ede8" },
  { name: "Pink", hex: "#e8c4c4" },
];

const WATCH_COLORS = [
  { name: "Midnight", hex: "#1a1a1a" },
  { name: "Starlight", hex: "#f0ede8" },
  { name: "Silver", hex: "#d4d4d4" },
  { name: "Rose Gold", hex: "#d4a0a0" },
];

const ACCESSORY_COLORS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#e8e8e8" },
  { name: "Navy", hex: "#1a2744" },
];

function getColorsForProduct(product: Product) {
  const cats = product.categories?.join(" ").toLowerCase() || "";
  if (cats.includes("audio")) return AUDIO_COLORS;
  if (cats.includes("tablet")) return TABLET_COLORS;
  if (cats.includes("wearable")) return WATCH_COLORS;
  if (cats.includes("accessor")) return ACCESSORY_COLORS;
  if (cats.includes("smartphone") || cats.includes("phone") || cats.includes("samsung") || cats.includes("apple")) return PHONE_COLORS;
  return null;
}

const STORAGE_OPTIONS = ["128GB", "256GB", "512GB"];

function hasStorageOptions(product: Product) {
  const cats = product.categories?.join(" ").toLowerCase() || "";
  return cats.includes("smartphone") || cats.includes("phone") || cats.includes("tablet") || cats.includes("laptop");
}

export function ProductDetail({ product, currency, relatedProducts = [] }: { product: Product; currency: string; relatedProducts?: Product[] }) {
  const { update, loading } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);

  const price = Number(product.sales_price ?? product.price);
  const originalPrice = product.sales_price ? Number(product.price) : null;
  const money = new Intl.NumberFormat("en", { style: "currency", currency }).format(price);
  const hasDiscount = originalPrice !== null && originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const colors = getColorsForProduct(product);
  const showStorage = hasStorageOptions(product);
  const images = product.images?.length ? product.images : [];
  const inStock = (product.stock ?? 0) > 0;

  const isRental = product.product_type === "rental";

  return (
    <main className="min-h-screen bg-[#f7f8f5] pt-6">
      <div className="mx-auto max-w-6xl px-5 py-4">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">
          <Link href="/" className="shrink-0 hover:text-[#14532d]">← Home</Link>
          <span className="shrink-0 text-[#cbd5e1]">/</span>
          <Link href="/shop" className="shrink-0 hover:text-[#14532d]">Shop all</Link>
          <span className="shrink-0 text-[#cbd5e1]">/</span>
          <Link href={`/#catalog`} className="shrink-0 hover:text-[#14532d]">Catalog</Link>
          <span className="shrink-0 text-[#cbd5e1]">/</span>
          <span className="shrink-0 text-[#5c7564]">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-12 px-5 pb-16">
        {/* Image gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative min-h-[300px] sm:min-h-[460px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#dcfce7] to-[#f0fdf4] p-4 sm:p-6 md:p-10 flex items-center justify-center border border-[#dbe6dd]">
            {images.length > 0 ? (
              <img src={images[selectedImage]} alt={product.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/Phoneplacelg.png"; }} className="h-full max-h-[560px] w-full object-contain rounded-xl" />
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center font-display text-9xl font-black text-[#166534]/10">01</div>
            )}
            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded-full bg-[#ef4444] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">-{discountPct}%</span>
            )}
            {inStock && !isRental && (
              <span className="absolute right-4 top-4 rounded-full bg-[#dcfce7] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#147243]">In stock</span>
            )}
            {isRental && (
              <span className="absolute right-4 top-4 rounded-full bg-[#fbbf24] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#78350f]">Lipa Pole Pole</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button key={idx} type="button" onClick={() => setSelectedImage(idx)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f8faf8] p-2 transition ${selectedImage === idx ? "border-[#147243]" : "border-[#dbe6dd] hover:border-[#76c88c]"}`} aria-label={`View image ${idx + 1}`}>
                  <img src={img} alt={`${product.name} image ${idx + 1}`} onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/Phoneplacelg.png"; }} className="h-full w-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <section className="flex flex-col">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">{product.categories?.[0] || "The collection"}</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-5xl text-[#0f172a]">{product.name}</h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-black text-[#166534]">{money}</span>
            {hasDiscount && (
              <span className="text-lg text-[#94a3b8] line-through">{new Intl.NumberFormat("en", { style: "currency", currency }).format(originalPrice!)}</span>
            )}
          </div>

          {product.sku && <p className="mt-3 text-xs text-[#94a3b8]">SKU: {product.sku}</p>}

          <div className="mt-6 border-t border-[#e2ece4] pt-6">
            <p className="leading-7 text-[#0f172a]/70">{product.description || "A carefully selected item from this store."}</p>
            {isRental && product.rental_terms && (
              <div className="mt-4 rounded-xl border border-[#fbbf24]/30 bg-[#fffbeb] p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#92400e]">Lipa Pole Pole — Pay Slowly</p>
                <p className="mt-1 text-sm font-semibold text-[#78350f]">{product.rental_terms}</p>
              </div>
            )}
          </div>

          {/* Color variations */}
          {colors && (
            <div className="mt-8 border-t border-[#e2ece4] pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">Color</h3>
                <span className="text-xs font-semibold text-[#5c7564]">{colors[selectedColor].name}</span>
              </div>
              <div className="mt-3 flex gap-3">
                {colors.map((color, idx) => (
                  <button key={color.name} type="button" onClick={() => setSelectedColor(idx)} aria-label={color.name} className={`relative h-10 w-10 rounded-full border-2 transition ${selectedColor === idx ? "border-[#147243] ring-2 ring-[#147243]/20" : "border-[#dbe6dd] hover:border-[#76c88c]"}`}>
                    <span className="absolute inset-1 rounded-full" style={{ backgroundColor: color.hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Storage variations */}
          {showStorage && (
            <div className="mt-6 border-t border-[#e2ece4] pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">Storage</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {STORAGE_OPTIONS.map((storage, idx) => (
                  <button key={storage} type="button" onClick={() => setSelectedStorage(idx)} className={`rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition ${selectedStorage === idx ? "border-[#147243] bg-[#dcfce7] text-[#147243]" : "border-[#dbe6dd] bg-white text-[#345140] hover:border-[#76c88c]"}`}>{storage}</button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to bag */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex border border-[#166534]/30 rounded-lg overflow-hidden">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 hover:bg-[#166534]/5 text-[#0f172a]">−</button>
              <span className="border-x border-[#166534]/30 px-5 py-4 text-[#0f172a]">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="px-4 hover:bg-[#166534]/5 text-[#0f172a]">+</button>
            </div>
            <button disabled={loading || !inStock} onClick={async () => { await update(product.id, quantity, { name: product.name, price: product.price, sales_price: product.sales_price, images: product.images }); }} className="flex-1 bg-[#166534] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#14532d] transition-colors shadow-md disabled:opacity-50 rounded-lg">{loading ? "Please wait…" : isRental ? "Apply for Lipa Pole Pole" : inStock ? "Add to bag" : "Out of stock"}</button>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#e2ece4] pt-6">
            <div className="text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-6 w-6 text-[#147243]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#345140]">Secure checkout</p>
            </div>
            <div className="text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-6 w-6 text-[#147243]"><rect width="16" height="13" x="1" y="3" rx="2" /><path d="M16 8h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-4" /></svg>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#345140]">Genuine product</p>
            </div>
            <div className="text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-6 w-6 text-[#147243]"><path d="M5 18H3V6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v12" /><path d="M14 7h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-4" /><path d="M3 18h18" /></svg>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#345140]">Fast delivery</p>
            </div>
          </div>
        </section>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[#e2ece4] bg-white py-12">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="font-display text-2xl font-black tracking-tight text-[#0f172a]">You may also like</h2>
            <p className="mt-1 text-sm text-[#64748b]">Other products you might be interested in</p>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {relatedProducts.map((rp) => {
                const rpPrice = Number(rp.sales_price ?? rp.price);
                const rpOriginal = rp.sales_price ? Number(rp.price) : null;
                const rpHasDiscount = rpOriginal !== null && rpOriginal > rpPrice;
                const rpDiscountPct = rpHasDiscount ? Math.round(((rpOriginal - rpPrice) / rpOriginal) * 100) : 0;
                const rpMoney = new Intl.NumberFormat("en", { style: "currency", currency }).format(rpPrice);
                const rpInStock = (rp.stock ?? 0) > 0;
                const rpImage = rp.images?.[0];

                return (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-[#e2ece4] bg-white transition hover:shadow-lg hover:border-[#147243]/30"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#dcfce7] to-[#f0fdf4] p-4">
                      {rpImage ? (
                        <img src={rpImage} alt={rp.name} className="h-full w-full object-contain mix-blend-multiply transition group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center font-display text-5xl font-black text-[#166534]/10">01</div>
                      )}
                      {rpHasDiscount && (
                        <span className="absolute left-2 top-2 rounded-full bg-[#ef4444] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">-{rpDiscountPct}%</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#166534]">{rp.categories?.[0] || "Product"}</p>
                      <h3 className="mt-1 text-sm font-bold leading-tight text-[#0f172a] line-clamp-2">{rp.name}</h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-display text-base font-black text-[#166534]">{rpMoney}</span>
                        {rpHasDiscount && (
                          <span className="text-xs text-[#94a3b8] line-through">{new Intl.NumberFormat("en", { style: "currency", currency }).format(rpOriginal!)}</span>
                        )}
                      </div>
                      <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${rpInStock ? "text-[#147243]" : "text-[#94a3b8]"}`}>
                        {rpInStock ? "In stock" : "Out of stock"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

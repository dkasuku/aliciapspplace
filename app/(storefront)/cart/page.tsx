"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

export const dynamic = "force-dynamic";

const amount = (value: number | string | undefined) => Number(value || 0);

export default function CartPage() {
  const { cart, update, loading, error } = useCart();
  const items = cart.items || [];
  const total = amount(cart.total || cart.subtotal);
  const count = cart.item_count ?? items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17251f]">
      <div className="mx-auto max-w-7xl px-5 pt-5">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">
          <Link href="/" className="hover:text-[#14532d]">← Home</Link>
          <span className="text-[#cbd5e1]">/</span>
          <span className="text-[#5c7564]">Shopping bag</span>
        </div>
      </div>
      <section className="border-b border-[#dbe5dc] bg-[#e9f7ec]">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#18864e]">Shopping bag</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.06em] text-[#123625] sm:text-5xl">
            Your bag {count > 0 && <span className="text-[#18864e]">({count})</span>}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-700 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        )}

        {items.length === 0 ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-[#dcfce7]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-[#147243]">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-black text-[#123625]">Your bag is empty</h2>
            <p className="mt-3 text-sm text-[#5c7564]">
              Looks like you haven&apos;t added anything yet. Explore our collection and find something you love.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-block rounded-xl bg-[#147243] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-md transition-colors hover:bg-[#0d5933]"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#dbe6dd] bg-white p-4 shadow-sm sm:flex-row"
                >
                  <Link
                    href={`/products/${item.product_id}`}
                    className="shrink-0 overflow-hidden rounded-xl border border-[#dce6de] bg-[#f8faf8]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/Phoneplacelg.png"}
                      alt={item.name || "Product"}
                      className="h-24 w-24 object-contain mix-blend-multiply"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="font-display text-base sm:text-lg font-bold text-[#0f172a] hover:text-[#147243]"
                      >
                        {item.name || item.product_name || "Product"}
                      </Link>
                      <span className="font-display text-lg font-black text-[#147243]">
                        KES {amount(item.total || amount(item.unit_price || item.price) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5c7564]">
                      KES {amount(item.unit_price || item.price).toLocaleString()} each
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-3">
                      <div className="flex items-center overflow-hidden rounded-lg border border-[#166534]/30">
                        <button
                          disabled={loading}
                          onClick={() => void update(item.product_id, Math.max(0, item.quantity - 1))}
                          className="px-3 py-1.5 text-sm hover:bg-[#166534]/5 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="border-x border-[#166534]/30 px-4 py-1.5 text-sm font-bold">{item.quantity}</span>
                        <button
                          disabled={loading}
                          onClick={() => void update(item.product_id, item.quantity + 1)}
                          className="px-3 py-1.5 text-sm hover:bg-[#166534]/5 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        disabled={loading}
                        onClick={() => void update(item.product_id, 0)}
                        className="ml-auto text-[10px] font-bold uppercase tracking-wider underline text-[#166534] hover:text-[#14532d] disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <Link
                href="/shop"
                className="inline-block text-xs font-bold uppercase tracking-wider text-[#147243] hover:underline"
              >
                ← Continue shopping
              </Link>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-[#dbe6dd] bg-white p-6 shadow-sm">
                <h2 className="font-display text-xl font-black text-[#123625]">Order summary</h2>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between text-[#345140]">
                    <span>Subtotal</span>
                    <span className="font-bold">KES {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#345140]">
                    <span>Delivery</span>
                    <span className="font-bold text-[#147243]">Calculated at checkout</span>
                  </div>
                </div>
                <div className="mt-5 flex justify-between border-t border-[#e2ece4] pt-5 font-display text-2xl font-black text-[#0f172a]">
                  <span>Total</span>
                  <span>KES {total.toLocaleString()}</span>
                </div>
                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-xl bg-[#147243] px-5 py-4 text-center text-xs font-black uppercase tracking-[0.18em] text-white shadow-md transition-colors hover:bg-[#0d5933]"
                >
                  Checkout securely →
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

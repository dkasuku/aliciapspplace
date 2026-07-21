"use client";

import Link from "next/link";
import { useCart } from "./cart-provider";

const amount = (value: number | string | undefined) => Number(value || 0);

export function CartDrawer() {
  const { cart, open, setOpen, update, loading, error } = useCart();
  if (!open) return null;
  const items = cart.items || [];
  return (
    <div className="fixed inset-0 z-[60] bg-[#0f172a]/40" onClick={() => setOpen(false)} role="presentation">
      <aside onClick={(event) => event.stopPropagation()} className="ml-auto flex h-full w-full max-w-md flex-col border-l border-[#166534]/20 bg-[#f8faf5] shadow-2xl" aria-label="Shopping bag">
        <header className="flex items-center justify-between border-b border-[#166534]/20 bg-[#166534] px-5 py-5">
          <h2 className="font-display text-3xl font-black text-white">Your bag [{items.reduce((sum, item) => sum + item.quantity, 0)}]</h2>
          <button type="button" onClick={() => setOpen(false)} className="p-2 text-2xl" aria-label="Close">×</button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="mb-4 border border-red-700 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {!items.length && <p className="mt-16 text-center font-display text-2xl text-[#0f172a]/40">Your bag is ready for something good.</p>}
          {items.map((item) => (
            <div key={item.product_id} className="border-b border-[#166534]/10 py-5">
              <div className="flex justify-between gap-4"><Link onClick={() => setOpen(false)} href={`/products/${item.product_id}`} className="font-display text-xl font-bold hover:text-[#166534] text-[#0f172a]">{item.name || item.product_name || "Product"}</Link><span className="font-bold text-[#166534]">{amount(item.total || amount(item.unit_price || item.price) * item.quantity).toLocaleString()}</span></div>
              <div className="mt-3 flex items-center gap-3"><button disabled={loading} onClick={() => void update(item.product_id, Math.max(0, item.quantity - 1))} className="border border-[#166534]/30 px-3 py-1 hover:bg-[#166534]/5">−</button><span>{item.quantity}</span><button disabled={loading} onClick={() => void update(item.product_id, item.quantity + 1)} className="border border-[#166534]/30 px-3 py-1 hover:bg-[#166534]/5">+</button><button disabled={loading} onClick={() => void update(item.product_id, 0)} className="ml-auto text-[10px] font-bold uppercase tracking-wider underline text-[#166534] hover:text-[#14532d]">Remove</button></div>
            </div>
          ))}
        </div>
        <div className="border-t border-[#166534]/10 p-5"><div className="mb-5 flex justify-between font-display text-2xl font-black text-[#0f172a]"><span>Total</span><span>{amount(cart.total || cart.subtotal).toLocaleString()}</span></div><Link onClick={() => setOpen(false)} aria-disabled={!items.length} href={items.length ? "/checkout" : "#"} className={`block w-full bg-[#166534] px-5 py-4 text-center text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#14532d] transition-colors shadow-md ${!items.length ? "pointer-events-none opacity-40" : ""}`}>Checkout securely →</Link></div>
      </aside>
    </div>
  );
}

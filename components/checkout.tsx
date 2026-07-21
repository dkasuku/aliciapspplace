"use client";

import Link from "next/link";
import { useState } from "react";
import { completeCheckout } from "@/app/(storefront)/checkout/actions";
import { useCart } from "./cart-provider";

const num = (value: unknown) => Number(value || 0);

export function Checkout() {
  const { cart, refresh } = useCart();
  const [contact, setContact] = useState({ full_name: "", email: "", phone_number: "", address_line1: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subtotal = num(cart.subtotal || cart.total);
  const total = subtotal;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await completeCheckout({
        ...contact,
        payment_method: "paystack",
        country: "Kenya",
      });
      setSuccess(true);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The order could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  if (success)
    return (
      <section className="mx-auto max-w-2xl px-5 py-32 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#166534]">Order received</p>
        <h1 className="font-display text-6xl font-black text-[#0f172a]">Thank you.</h1>
        <p className="mt-6 text-[#0f172a]/65">Your order is confirmed. Check your email for the receipt and updates.</p>
        <Link href="/" className="mt-10 inline-block bg-[#166534] px-7 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#14532d] transition-colors shadow-md">Continue shopping</Link>
      </section>
    );

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl lg:grid-cols-[1fr_390px] bg-[#f8faf5]">
      <div className="border-r border-[#166534]/10 px-5 py-12 md:px-10 bg-[#f8faf5]">
        <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">
          <Link href="/" className="hover:text-[#14532d]">← Home</Link>
          <span className="text-[#cbd5e1]">/</span>
          <Link href="/cart" className="hover:text-[#14532d]">Bag</Link>
          <span className="text-[#cbd5e1]">/</span>
          <span className="text-[#5c7564]">Checkout</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">One-page checkout</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-5xl md:text-7xl text-[#0f172a]">Complete your order</h1>
        {error && <p className="mt-6 border border-red-700 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
        <fieldset className="mt-10 border-t border-[#166534]/20 pt-7">
          <legend className="font-display text-2xl font-bold text-[#0f172a]">1. Contact</legend>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Full name" required value={contact.full_name} onChange={(value) => setContact({ ...contact, full_name: value })} />
            <Field label="Email address" type="email" required value={contact.email} onChange={(value) => setContact({ ...contact, email: value })} />
            <Field label="Phone number" type="tel" required value={contact.phone_number} onChange={(value) => setContact({ ...contact, phone_number: value })} />
            <Field label="Delivery address" value={contact.address_line1} onChange={(value) => setContact({ ...contact, address_line1: value })} />
            <Field label="City" value={contact.city} onChange={(value) => setContact({ ...contact, city: value })} />
          </div>
        </fieldset>
      </div>
      <aside className="bg-white px-5 py-12 md:px-8 border-t md:border-t-0 md:border-l border-[#166534]/10">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">Order summary</p>
        <div className="mt-6 space-y-4">
          {cart.items?.map((item) => (
            <div key={item.product_id} className="flex justify-between gap-4 border-b border-[#166534]/10 pb-4">
              <span>{item.name || item.product_name || "Product"} × {item.quantity}</span>
              <b>{num(item.total || num(item.price || item.unit_price) * item.quantity).toLocaleString()}</b>
            </div>
          ))}
        </div>
        <div className="mt-7 space-y-3 text-sm">
          <div className="flex justify-between border-t border-[#166534]/20 pt-5 font-display text-2xl font-black">
            <span>Total</span>
            <span>{total.toLocaleString()}</span>
          </div>
        </div>
        <button disabled={busy || !cart.items?.length} className="mt-8 w-full bg-[#166534] px-5 py-5 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#14532d] transition-colors shadow-md disabled:opacity-40">
          {busy ? "Please wait…" : "Place order"}
        </button>
      </aside>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider text-[#0f172a]/80">
      {label}{required && " *"}
      <input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-[#166534]/30 bg-white p-4 text-sm font-normal normal-case text-[#0f172a] focus:outline-none focus:border-[#166534]" />
    </label>
  );
}

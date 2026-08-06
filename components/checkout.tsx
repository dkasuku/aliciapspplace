"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { completeCheckout } from "@/app/(storefront)/checkout/actions";
import { PICKUP_TIER, quoteDelivery, resolveTiers, type DeliveryTier, type Fulfilment, type LatLng } from "@/lib/delivery";
import { ORDER_WHATSAPP_DISPLAY, type OrderSummary } from "@/lib/whatsapp";
import { OrderConfirmation } from "./order-confirmation";
import { useCart } from "./cart-provider";

const DeliveryMap = dynamic(() => import("./delivery-map").then((mod) => mod.DeliveryMap), {
  ssr: false,
  loading: () => <div className="mt-3 h-72 w-full animate-pulse border border-[#166534]/25 bg-[#eef2ec] sm:h-80" />,
});

const num = (value: unknown) => Number(value || 0);
const money = (value: number) => `KES ${num(value).toLocaleString()}`;

export function Checkout({ tiers }: { tiers?: DeliveryTier[] | null }) {
  const DELIVERY_TIERS = resolveTiers(tiers);
  const { cart, refresh } = useCart();
  const [contact, setContact] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address_line1: "",
    city: "",
    notes: "",
  });
  const [fulfilment, setFulfilment] = useState<Fulfilment>("delivery");
  const [dropOff, setDropOff] = useState<LatLng | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ order: OrderSummary; warning?: string } | null>(null);

  const delivering = fulfilment === "delivery";
  const quote = quoteDelivery(delivering ? dropOff : null, tiers);
  const subtotal = num(cart.subtotal || cart.total);
  const total = subtotal + quote.fee;
  const needsPin = delivering && !dropOff;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Every order is confirmed on WhatsApp; there is no online payment step.
    const choice = "later" as const;

    if (needsPin) {
      setError("Mark your delivery spot on the map first — that is how we work out the fee.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await completeCheckout({
        ...contact,
        payment_choice: choice,
        fulfilment,
        drop_off: delivering ? dropOff : null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if ("redirectUrl" in result) {
        window.location.href = result.redirectUrl;
        return;
      }

      setPlaced({ order: result.order, warning: result.warning });
      await refresh();
    } catch {
      setError("The order could not be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (placed) return <OrderConfirmation order={placed.order} warning={placed.warning} />;

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-6xl bg-[#f8faf5] lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="px-5 py-12 md:px-10 lg:border-r lg:border-[#166534]/10">
        <div className="mb-6 flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">
          <Link href="/" className="hover:text-[#14532d]">← Home</Link>
          <span className="text-[#cbd5e1]">/</span>
          <Link href="/cart" className="hover:text-[#14532d]">Bag</Link>
          <span className="text-[#cbd5e1]">/</span>
          <span className="text-[#5c7564]">Checkout</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">One-page checkout</p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-5xl md:text-7xl text-[#0f172a]">Complete your order</h1>
        <p className="mt-4 max-w-lg text-sm text-[#0f172a]/60">
          We confirm every order on WhatsApp ({ORDER_WHATSAPP_DISPLAY}) before it leaves the shop.
        </p>
        {error && <p className="mt-6 border border-red-700 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        <fieldset className="mt-10 border-t border-[#166534]/20 pt-7">
          <legend className="font-display text-2xl font-bold text-[#0f172a]">1. Contact</legend>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Full name" required value={contact.full_name} onChange={(value) => setContact({ ...contact, full_name: value })} />
            <Field label="Email address" type="email" required value={contact.email} onChange={(value) => setContact({ ...contact, email: value })} />
            <Field label="Phone number" type="tel" required placeholder="07xx xxx xxx" value={contact.phone_number} onChange={(value) => setContact({ ...contact, phone_number: value })} />
            <Field label="City / area" value={contact.city} onChange={(value) => setContact({ ...contact, city: value })} />
            <Field label="Delivery address" required={delivering} value={contact.address_line1} onChange={(value) => setContact({ ...contact, address_line1: value })} />
            <Field label="Notes for us (optional)" value={contact.notes} onChange={(value) => setContact({ ...contact, notes: value })} />
          </div>
        </fieldset>

        <fieldset className="mt-10 border-t border-[#166534]/20 pt-7">
          <legend className="font-display text-2xl font-bold text-[#0f172a]">2. How do you want it?</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Choice
              checked={delivering}
              onSelect={() => setFulfilment("delivery")}
              title="Deliver to me"
              detail="Priced from your pin, measured from Juja Square."
            />
            <Choice
              checked={!delivering}
              onSelect={() => setFulfilment("pickup")}
              title="Collect from the shop"
              detail={`${PICKUP_TIER.hint} — no delivery fee.`}
            />
          </div>

          {delivering && (
            <div className="mt-6">
              <ul className="mb-5 divide-y divide-[#166534]/10 border border-[#166534]/20 bg-white text-sm">
                {DELIVERY_TIERS.map((tier) => (
                  <li
                    key={tier.id}
                    className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${
                      dropOff && quote.tier === tier.id ? "bg-[#f0fdf4]" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <b className="text-[#0f172a]">{tier.label}</b>
                      <span className="block text-xs text-[#0f172a]/55">{tier.hint}</span>
                    </span>
                    <b className="shrink-0 text-[#166534]">{money(tier.fee)}</b>
                  </li>
                ))}
              </ul>

              <DeliveryMap value={dropOff} onChange={setDropOff} />

              <div
                className={`mt-3 border p-4 text-sm ${
                  dropOff ? "border-[#166534]/30 bg-white" : "border-amber-500/60 bg-amber-50 text-amber-900"
                }`}
              >
                {dropOff ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[#0f172a]/70">
                        <b className="text-[#0f172a]">{quote.km.toFixed(1)} km</b> from Juja Square · {quote.label}
                      </span>
                      <b className="text-[#166534]">{money(quote.fee)} delivery</b>
                    </div>
                    {quote.note && <p className="mt-2 text-xs text-amber-800">{quote.note}</p>}
                  </>
                ) : (
                  "Drop a pin on the map to see your delivery fee."
                )}
              </div>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="border-t border-[#166534]/10 bg-white px-5 py-12 md:px-8 lg:border-t-0 lg:border-l">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">Order summary</p>
        <div className="mt-6 space-y-4">
          {cart.items?.map((item) => (
            <div key={item.product_id} className="flex min-w-0 justify-between gap-4 border-b border-[#166534]/10 pb-4 text-sm">
              <span className="min-w-0 break-words">{item.name || item.product_name || "Product"} × {item.quantity}</span>
              <b className="shrink-0">{money(num(item.total || num(item.price || item.unit_price) * item.quantity))}</b>
            </div>
          ))}
        </div>
        <div className="mt-7 space-y-3 text-sm">
          <div className="flex justify-between gap-4 text-[#0f172a]/70">
            <span>Subtotal</span>
            <span className="shrink-0">{money(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4 text-[#0f172a]/70">
            <span className="min-w-0 break-words">
              {delivering ? (dropOff ? `Delivery · ${quote.label}` : "Delivery") : "Collection · Juja Square"}
            </span>
            <span className="shrink-0">
              {delivering ? (dropOff ? money(quote.fee) : "Pin your spot") : "Free"}
            </span>
          </div>
          <div className="flex min-w-0 justify-between gap-4 border-t border-[#166534]/20 pt-5 font-display text-2xl font-black">
            <span>Total</span>
            <span className="shrink-0">{money(total)}</span>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="submit"
            name="choice"
            value="later"
            disabled={busy || !cart.items?.length}
            className="flex w-full items-center justify-center gap-2 bg-[#25D366] px-5 py-5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-md transition-colors hover:bg-[#1da851] disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12.05 21.8h-.02a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37a9.8 9.8 0 0 1-1.5-5.23c0-5.4 4.4-9.8 9.82-9.8 2.62 0 5.08 1.03 6.94 2.88a9.74 9.74 0 0 1 2.87 6.93c0 5.4-4.4 9.8-9.81 9.8m8.35-18.15A11.7 11.7 0 0 0 12.05 0C5.6 0 .35 5.24.35 11.68c0 2.06.54 4.07 1.56 5.85L.25 24l6.62-1.73a11.68 11.68 0 0 0 5.18 1.24h.01c6.44 0 11.69-5.24 11.69-11.68a11.6 11.6 0 0 0-3.35-8.18" />
            </svg>
            {busy ? "Sending…" : "Send order on WhatsApp"}
          </button>

        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#0f172a]/50">
          We confirm every order on WhatsApp, then you pay on delivery or collection.
        </p>
      </aside>
    </form>
  );
}

function Choice({
  checked,
  onSelect,
  title,
  detail,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col gap-1 border p-4 transition-colors ${
        checked ? "border-[#166534] bg-white shadow-sm" : "border-[#166534]/20 hover:border-[#166534]/50"
      }`}
    >
      <input type="radio" name="fulfilment" className="sr-only" checked={checked} onChange={onSelect} />
      <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">{title}</span>
      <span className="text-xs text-[#0f172a]/55">{detail}</span>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-xs font-bold uppercase tracking-wider text-[#0f172a]/80">
      {label}{required && " *"}
      <input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-[#166534]/30 bg-white p-4 text-sm font-normal normal-case text-[#0f172a] focus:outline-none focus:border-[#166534]" />
    </label>
  );
}

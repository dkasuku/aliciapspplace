"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { completeCheckout } from "@/app/(storefront)/checkout/actions";
import { DELIVERY_ZONES, DEFAULT_ZONE_ID, deliveryFeeFor, findZone } from "@/lib/delivery";
import { ORDER_WHATSAPP_DISPLAY, type OrderSummary } from "@/lib/whatsapp";
import { OrderConfirmation } from "./order-confirmation";
import { useCart } from "./cart-provider";

const num = (value: unknown) => Number(value || 0);
const money = (value: number) => `KES ${num(value).toLocaleString()}`;

type PaymentMethod = "delivery" | "online";

export function Checkout() {
  const { cart, refresh } = useCart();
  const [contact, setContact] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address_line1: "",
    city: "",
    notes: "",
  });
  const [zoneId, setZoneId] = useState(DEFAULT_ZONE_ID);
  const [payment, setPayment] = useState<PaymentMethod>("delivery");
  const [onlineEnabled, setOnlineEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ order: OrderSummary; warning?: string } | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/payments/config")
      .then((response) => response.json())
      .then((payload: { online_payment_enabled?: boolean }) => {
        if (active) setOnlineEnabled(Boolean(payload.online_payment_enabled));
      })
      .catch(() => {
        if (active) setOnlineEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const zone = findZone(zoneId) ?? findZone(DEFAULT_ZONE_ID)!;
  const subtotal = num(cart.subtotal || cart.total);
  const deliveryFee = deliveryFeeFor(zoneId);
  const total = subtotal + deliveryFee;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await completeCheckout({
        ...contact,
        payment_method: payment,
        delivery_zone: zoneId,
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
            <Field label="Delivery address" required={zoneId !== "pickup"} value={contact.address_line1} onChange={(value) => setContact({ ...contact, address_line1: value })} />
            <Field label="Notes for us (optional)" value={contact.notes} onChange={(value) => setContact({ ...contact, notes: value })} />
          </div>
        </fieldset>

        <fieldset className="mt-10 border-t border-[#166534]/20 pt-7">
          <legend className="font-display text-2xl font-bold text-[#0f172a]">2. Delivery</legend>
          <p className="mt-2 text-sm text-[#0f172a]/60">Delivery starts at KES 70 for 0 – 5 km. Pick the distance from Juja town.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {DELIVERY_ZONES.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start justify-between gap-3 border p-4 transition-colors ${
                  zoneId === option.id ? "border-[#166534] bg-white shadow-sm" : "border-[#166534]/20 hover:border-[#166534]/50"
                }`}
              >
                <span className="min-w-0">
                  <input
                    type="radio"
                    name="delivery_zone"
                    className="sr-only"
                    checked={zoneId === option.id}
                    onChange={() => setZoneId(option.id)}
                  />
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#0f172a]">{option.label}</span>
                  <span className="mt-1 block text-xs text-[#0f172a]/55">{option.hint}</span>
                </span>
                <b className="shrink-0 text-sm text-[#166534]">{option.fee > 0 ? money(option.fee) : "Free"}</b>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-10 border-t border-[#166534]/20 pt-7">
          <legend className="font-display text-2xl font-bold text-[#0f172a]">3. Payment</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer flex-col gap-1 border p-4 transition-colors ${
                payment === "delivery" ? "border-[#166534] bg-white shadow-sm" : "border-[#166534]/20 hover:border-[#166534]/50"
              }`}
            >
              <input type="radio" name="payment" className="sr-only" checked={payment === "delivery"} onChange={() => setPayment("delivery")} />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">Pay on delivery</span>
              <span className="text-xs text-[#0f172a]/55">Cash or M-Pesa when the order reaches you.</span>
            </label>
            <label
              className={`flex flex-col gap-1 border p-4 transition-colors ${
                onlineEnabled === false
                  ? "cursor-not-allowed border-[#166534]/15 opacity-55"
                  : payment === "online"
                    ? "cursor-pointer border-[#166534] bg-white shadow-sm"
                    : "cursor-pointer border-[#166534]/20 hover:border-[#166534]/50"
              }`}
            >
              <input
                type="radio"
                name="payment"
                className="sr-only"
                disabled={onlineEnabled === false}
                checked={payment === "online"}
                onChange={() => setPayment("online")}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">Pay online now</span>
              <span className="text-xs text-[#0f172a]/55">
                {onlineEnabled === false
                  ? "Not available yet — choose pay on delivery."
                  : "Secure card or M-Pesa payment before delivery."}
              </span>
            </label>
          </div>
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
            <span className="min-w-0 break-words">Delivery · {zone.label}</span>
            <span className="shrink-0">{deliveryFee > 0 ? money(deliveryFee) : "Free"}</span>
          </div>
          <div className="flex min-w-0 justify-between gap-4 border-t border-[#166534]/20 pt-5 font-display text-2xl font-black">
            <span>Total</span>
            <span className="shrink-0">{money(total)}</span>
          </div>
        </div>
        <button disabled={busy || !cart.items?.length} className="mt-8 w-full bg-[#166534] px-5 py-5 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-[#14532d] transition-colors shadow-md disabled:opacity-40">
          {busy ? "Please wait…" : payment === "online" ? `Pay ${money(total)} online` : "Place order"}
        </button>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-[#0f172a]/50">
          {payment === "online"
            ? "You'll be taken to a secure payment page, then straight to WhatsApp to confirm."
            : "Your order opens in WhatsApp so we can confirm it right away."}
        </p>
      </aside>
    </form>
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

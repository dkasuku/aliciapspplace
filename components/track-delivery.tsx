"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DELIVERY_STAGES, STATUS_LABELS, stageIndex, type TrackedDelivery } from "@/lib/tracking";
import { ORDER_WHATSAPP_DISPLAY, ORDER_WHATSAPP_NUMBER } from "@/lib/whatsapp";

const money = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

const when = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";

export function TrackDelivery({ initialRef = "" }: { initialRef?: string }) {
  const [ref, setRef] = useState(initialRef);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<TrackedDelivery | null>(null);

  const lookup = useCallback(async (orderRef: string, phoneNumber: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/track?ref=${encodeURIComponent(orderRef)}&phone=${encodeURIComponent(phoneNumber)}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        setDelivery(null);
        setError(payload.error || "We could not find that order.");
        return;
      }
      setDelivery(payload as TrackedDelivery);
    } catch {
      setDelivery(null);
      setError("Could not reach the tracking service. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }, []);

  // Re-check while a rider is on the move.
  useEffect(() => {
    if (!delivery || delivery.status === "delivered" || delivery.status === "cancelled") return;
    const timer = setInterval(() => void lookup(ref, phone), 60000);
    return () => clearInterval(timer);
  }, [delivery, ref, phone, lookup]);

  const current = delivery ? stageIndex(delivery.status) : -1;
  const cancelled = delivery?.status === "cancelled";

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#166534]">
        <Link href="/" className="hover:text-[#14532d]">← Home</Link>
        <span className="text-[#cbd5e1]">/</span>
        <span className="text-[#5c7564]">Track delivery</span>
      </div>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">Where is my order?</p>
      <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-[#0f172a] sm:text-5xl">Track your delivery</h1>
      <p className="mt-4 text-sm text-[#0f172a]/60">
        Enter the order number from your confirmation and the phone number you ordered with.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void lookup(ref.trim(), phone.trim());
        }}
        className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <label className="text-xs font-bold uppercase tracking-wider text-[#0f172a]/80">
          Order number *
          <input
            required
            value={ref}
            onChange={(event) => setRef(event.target.value)}
            placeholder="APP-2026…"
            className="mt-2 w-full border border-[#166534]/30 bg-white p-4 text-sm font-normal normal-case text-[#0f172a] focus:border-[#166534] focus:outline-none"
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-[#0f172a]/80">
          Phone number *
          <input
            required
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="07xx xxx xxx"
            className="mt-2 w-full border border-[#166534]/30 bg-white p-4 text-sm font-normal normal-case text-[#0f172a] focus:border-[#166534] focus:outline-none"
          />
        </label>
        <button
          disabled={busy}
          className="mt-auto h-[54px] bg-[#166534] px-8 text-xs font-black uppercase tracking-[0.16em] text-white shadow-md transition-colors hover:bg-[#14532d] disabled:opacity-40"
        >
          {busy ? "Checking…" : "Track"}
        </button>
      </form>

      {error && <p className="mt-6 border border-red-700 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {delivery && (
        <div className="mt-10 border border-[#166534]/20 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#166534]/15 p-6">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold text-[#0f172a]/60">{delivery.order_ref}</p>
              <p className="mt-1 font-display text-2xl font-black text-[#0f172a]">
                {STATUS_LABELS[delivery.status] || delivery.status}
              </p>
              {delivery.eta && <p className="mt-1 text-sm text-[#166534]">Expected: {delivery.eta}</p>}
            </div>
            <span
              className={`shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                cancelled
                  ? "bg-red-100 text-red-800"
                  : delivery.status === "delivered"
                    ? "bg-[#166534] text-white"
                    : "bg-[#dcfce7] text-[#166534]"
              }`}
            >
              {delivery.fulfilment === "pickup" ? "Collection" : "Delivery"}
            </span>
          </div>

          {cancelled ? (
            <p className="border-b border-[#166534]/15 bg-red-50 p-6 text-sm text-red-800">
              This order was cancelled. Message us on WhatsApp if that looks wrong.
            </p>
          ) : (
            <ol className="p-6">
              {DELIVERY_STAGES.map((stage, index) => {
                const done = index <= current;
                const active = index === current;
                const event = [...delivery.events].reverse().find((item) => item.status === stage.id);
                return (
                  <li key={stage.id} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                          done ? "bg-[#166534] text-white" : "border border-[#166534]/25 bg-white text-[#166534]/40"
                        }`}
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      {index < DELIVERY_STAGES.length - 1 && (
                        <span className={`mt-1 w-px flex-1 ${index < current ? "bg-[#166534]" : "bg-[#166534]/15"}`} />
                      )}
                    </div>
                    <div className="min-w-0 pb-1">
                      <p className={`text-sm font-bold ${active ? "text-[#166534]" : done ? "text-[#0f172a]" : "text-[#0f172a]/40"}`}>
                        {stage.label}
                      </p>
                      <p className={`mt-0.5 text-xs ${done ? "text-[#0f172a]/60" : "text-[#0f172a]/35"}`}>
                        {event?.note || stage.detail}
                      </p>
                      {event && <p className="mt-1 text-[11px] text-[#0f172a]/45">{when(event.at)}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {(delivery.rider_name || delivery.rider_phone) && (
            <div className="border-t border-[#166534]/15 bg-[#f8faf5] p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">Your rider</p>
              <p className="mt-2 text-sm text-[#0f172a]">
                {delivery.rider_name || "On the way"}
                {delivery.rider_phone && (
                  <>
                    {" · "}
                    <a href={`tel:${delivery.rider_phone.replace(/\s/g, "")}`} className="font-bold text-[#166534] underline">
                      {delivery.rider_phone}
                    </a>
                  </>
                )}
              </p>
            </div>
          )}

          <div className="border-t border-[#166534]/15 p-6 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">Order</p>
            <ul className="mt-3 space-y-2">
              {delivery.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex justify-between gap-4">
                  <span className="min-w-0 break-words text-[#0f172a]/75">{item.name} × {item.quantity}</span>
                  <b className="shrink-0">{money(item.total)}</b>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-[#166534]/15 pt-4 text-[#0f172a]/70">
              <div className="flex justify-between gap-4">
                <span className="min-w-0">
                  {delivery.fulfilment === "pickup"
                    ? "Collection · Juja Town"
                    : `Delivery${delivery.distance_km != null ? ` · ${delivery.distance_km.toFixed(1)} km` : ""}`}
                </span>
                <span className="shrink-0">{delivery.delivery_fee > 0 ? money(delivery.delivery_fee) : "Free"}</span>
              </div>
              <div className="flex justify-between gap-4 pt-2 font-display text-xl font-black text-[#0f172a]">
                <span>Total</span>
                <span>{money(delivery.total)}</span>
              </div>
              {delivery.payment_status && <p className="pt-2 text-xs">{delivery.payment_status}</p>}
            </div>
          </div>

          <div className="border-t border-[#166534]/15 p-6">
            <a
              href={`https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I'd like an update on order ${delivery.order_ref}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#25D366] px-5 py-4 text-center text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#1da851]"
            >
              Ask about this order on WhatsApp
            </a>
          </div>
        </div>
      )}

      {!delivery && !error && (
        <p className="mt-10 border border-[#166534]/15 bg-white p-6 text-sm text-[#0f172a]/60">
          Lost your order number? Message us on WhatsApp at{" "}
          <a href={`https://wa.me/${ORDER_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#166534] underline">
            {ORDER_WHATSAPP_DISPLAY}
          </a>{" "}
          and we will look it up for you.
        </p>
      )}
    </section>
  );
}

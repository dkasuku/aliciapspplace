"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { buildOrderWhatsAppLink, ORDER_WHATSAPP_DISPLAY, type OrderSummary } from "@/lib/whatsapp";

const money = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

export function OrderConfirmation({
  order,
  warning,
  autoOpen = true,
}: {
  order: OrderSummary;
  warning?: string;
  autoOpen?: boolean;
}) {
  const link = buildOrderWhatsAppLink(order);
  const opened = useRef(false);

  useEffect(() => {
    if (!autoOpen || opened.current) return;
    opened.current = true;
    // Pop-up blockers can swallow this, which is why the button below stays.
    window.open(link, "_blank", "noopener,noreferrer");
  }, [autoOpen, link]);

  return (
    <section className="mx-auto max-w-2xl px-5 py-20 text-center">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#166534]">Order received</p>
      <h1 className="font-display text-4xl font-black text-[#0f172a] sm:text-6xl">Thank you.</h1>
      <p className="mt-5 text-[#0f172a]/65">
        Order <b className="text-[#0f172a]">{order.reference}</b> — send it to us on WhatsApp so we can confirm
        stock and delivery straight away.
      </p>

      {warning && (
        <p className="mt-6 border border-amber-500 bg-amber-50 p-4 text-left text-sm text-amber-900">{warning}</p>
      )}

      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex w-full items-center justify-center gap-2 bg-[#25D366] px-7 py-5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-md transition-colors hover:bg-[#1da851] sm:w-auto"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12.05 21.8h-.02a9.8 9.8 0 0 1-4.99-1.37l-.36-.21-3.71.97.99-3.62-.23-.37a9.8 9.8 0 0 1-1.5-5.23c0-5.4 4.4-9.8 9.82-9.8 2.62 0 5.08 1.03 6.94 2.88a9.74 9.74 0 0 1 2.87 6.93c0 5.4-4.4 9.8-9.81 9.8m8.35-18.15A11.7 11.7 0 0 0 12.05 0C5.6 0 .35 5.24.35 11.68c0 2.06.54 4.07 1.56 5.85L.25 24l6.62-1.73a11.68 11.68 0 0 0 5.18 1.24h.01c6.44 0 11.69-5.24 11.69-11.68a11.6 11.6 0 0 0-3.35-8.18" />
        </svg>
        Send order on WhatsApp
      </a>

      <p className="mt-4 text-xs text-[#0f172a]/55">
        Goes to {ORDER_WHATSAPP_DISPLAY}. Didn&apos;t open? Tap the button above.
      </p>

      <Link
        href={`/track?ref=${encodeURIComponent(order.reference)}`}
        className="mt-6 inline-flex w-full items-center justify-center border border-[#166534]/40 px-7 py-4 text-xs font-bold uppercase tracking-wider text-[#166534] transition-colors hover:bg-[#166534]/5 sm:w-auto"
      >
        Track this delivery
      </Link>
      <p className="mt-2 text-xs text-[#0f172a]/50">
        Save your order number — you&apos;ll need it plus your phone number to track.
      </p>

      <div className="mt-10 border border-[#166534]/15 bg-white p-6 text-left text-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#166534]">Order summary</p>
        <ul className="mt-4 space-y-2">
          {order.items.map((item) => (
            <li key={item.product_id} className="flex justify-between gap-4">
              <span className="min-w-0 break-words">
                {item.name} × {item.quantity}
              </span>
              <b className="shrink-0">{money(item.total)}</b>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-[#166534]/15 pt-4 text-[#0f172a]/70">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="min-w-0 break-words">
              {order.delivery_km != null ? `Delivery · ${order.delivery_km.toFixed(1)} km from Juja` : order.delivery_label}
            </span>
            <span className="shrink-0">{order.delivery_fee > 0 ? money(order.delivery_fee) : "Free"}</span>
          </div>
          {order.map_link && (
            <a href={order.map_link} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#166534] underline">
              View the drop-off pin on the map
            </a>
          )}
          <div className="flex justify-between pt-2 font-display text-xl font-black text-[#0f172a]">
            <span>Total</span>
            <span>{money(order.total)}</span>
          </div>
          <p className="pt-3 text-xs">{order.payment_label} — {order.payment_status}</p>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 inline-block bg-[#166534] px-7 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-[#14532d]"
      >
        Continue shopping
      </Link>
    </section>
  );
}

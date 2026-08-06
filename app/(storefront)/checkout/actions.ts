"use server";

import { cookies, headers } from "next/headers";
import { mapsLink, quoteDelivery, type Fulfilment, type LatLng } from "@/lib/delivery";
import { getSiteContent } from "@/lib/site-content";
import {
  CART_COOKIE,
  PENDING_ORDER_COOKIE,
  createDelivery,
  initializePaystack,
  isPaystackConfigured,
  parseCart,
  recordSale,
} from "@/lib/checkout-server";
import { trackingUrl } from "@/lib/tracking";
import type { OrderSummary } from "@/lib/whatsapp";

export interface CheckoutInput {
  full_name: string;
  email: string;
  phone_number: string;
  /** "later" sends the order straight to WhatsApp; "now" goes through Paystack first. */
  payment_choice: "later" | "now";
  fulfilment: Fulfilment;
  drop_off?: LatLng | null;
  address_line1?: string;
  city?: string;
  notes?: string;
}

export type CheckoutResult =
  | { ok: true; order: OrderSummary; warning?: string }
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

const PAYMENT_METHODS: Record<CheckoutInput["payment_choice"], { code: string; label: string; status: string }> = {
  later: {
    code: "on_delivery",
    label: "Pay on delivery (Cash / M-Pesa)",
    status: "Not paid yet — collect on delivery",
  },
  now: {
    code: "paystack",
    label: "Paid online (card / M-Pesa via Paystack)",
    status: "Paid online",
  },
};

function reference(): string {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `APP-${stamp}-${suffix}`;
}

async function originUrl(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") || list.get("host") || "localhost:3000";
  const proto = list.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function validPoint(point: LatLng | null | undefined): point is LatLng {
  return (
    !!point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

/**
 * Expected failures are returned, never thrown: Next.js replaces a thrown
 * Server Action error with an opaque digest in production builds, which is what
 * used to surface on this page as "An error occurred in the Server Components
 * render".
 */
export async function completeCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const full_name = input.full_name?.trim() || "";
  const email = input.email?.trim() || "";
  const phone_number = input.phone_number?.trim() || "";

  if (!full_name || !email || !phone_number) {
    return { ok: false, error: "Name, email and phone number are required." };
  }

  const wantsDelivery = input.fulfilment !== "pickup";
  if (wantsDelivery && !validPoint(input.drop_off)) {
    return { ok: false, error: "Please mark your delivery spot on the map so we can work out the fee." };
  }
  if (wantsDelivery && !input.address_line1?.trim()) {
    return { ok: false, error: "Please add a delivery address, or choose to collect from the shop." };
  }

  const jar = await cookies();
  const cart = parseCart(jar.get(CART_COOKIE)?.value);
  if (!cart) return { ok: false, error: "Your bag is empty. Add a product before checking out." };

  const items = cart.items.map((item) => {
    const unit_price = Number(item.unit_price || item.price || 0);
    return {
      product_id: item.product_id,
      name: item.name || item.product_name || "Product",
      quantity: item.quantity,
      unit_price,
      total: Number(item.total || unit_price * item.quantity),
    };
  });

  // The fee is derived from the coordinates here, so a tampered client cannot set its own price.
  const dropOff = wantsDelivery && validPoint(input.drop_off) ? input.drop_off : null;
  // Priced server-side from the shop's saved rates, so the browser cannot set its own fee.
  const tiers = (await getSiteContent()).deliveryTiers;
  const quote = quoteDelivery(dropOff, tiers);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + quote.fee;
  const method = PAYMENT_METHODS[input.payment_choice] || PAYMENT_METHODS.later;
  const orderRef = reference();
  const origin = await originUrl();

  const order: OrderSummary = {
    reference: orderRef,
    items,
    subtotal,
    delivery_fee: quote.fee,
    delivery_label: quote.label,
    delivery_km: dropOff ? quote.km : undefined,
    delivery_note: dropOff ? quote.note : undefined,
    map_link: dropOff ? mapsLink(dropOff) : undefined,
    fulfilment: wantsDelivery ? "delivery" : "pickup",
    drop_off: dropOff ?? undefined,
    tracking_url: trackingUrl(origin, orderRef),
    total,
    payment_code: method.code,
    payment_label: method.label,
    payment_status: method.status,
    full_name,
    phone_number,
    email,
    address_line1: input.address_line1?.trim() || undefined,
    city: input.city?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };

  if (input.payment_choice === "now") {
    if (!isPaystackConfigured()) {
      return {
        ok: false,
        error: "Paying online is not switched on yet. Use “Send order on WhatsApp” and pay on delivery instead.",
      };
    }

    const started = await initializePaystack({
      email,
      amount: total,
      reference: order.reference,
      callbackUrl: `${origin}/api/payments/callback`,
      metadata: { customer: full_name, phone: phone_number, delivery: quote.label },
    });

    if (!started.ok) return { ok: false, error: started.error };

    // Keep the bag intact until Paystack confirms; park the order for the callback.
    jar.set(PENDING_ORDER_COOKIE, JSON.stringify(order), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    });

    return { ok: true, redirectUrl: started.authorizationUrl };
  }

  // The sale is the shop's books; the delivery is what the customer tracks. The
  // tracking reference stays ours so the shopper keeps the link they were given.
  const [saved] = await Promise.all([recordSale(order), createDelivery(order)]);

  jar.delete(CART_COOKIE);

  return {
    ok: true,
    order,
    warning: saved.recorded
      ? undefined
      : `Your order was taken, but it could not be saved to the shop system (${saved.reason}). Send it on WhatsApp so we do not miss it.`,
  };
}

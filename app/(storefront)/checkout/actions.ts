"use server";

import { cookies, headers } from "next/headers";
import { deliveryFeeFor, findZone, DEFAULT_ZONE_ID } from "@/lib/delivery";
import {
  CART_COOKIE,
  PENDING_ORDER_COOKIE,
  initializePaystack,
  isPaystackConfigured,
  parseCart,
  recordSale,
} from "@/lib/checkout-server";
import type { OrderSummary } from "@/lib/whatsapp";

export interface CheckoutInput {
  full_name: string;
  email: string;
  phone_number: string;
  payment_method: "delivery" | "online";
  delivery_zone: string;
  address_line1?: string;
  city?: string;
  notes?: string;
}

export type CheckoutResult =
  | { ok: true; order: OrderSummary; warning?: string }
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

const PAYMENT_METHODS: Record<CheckoutInput["payment_method"], { code: string; label: string }> = {
  delivery: { code: "on_delivery", label: "Pay on delivery (Cash / M-Pesa)" },
  online: { code: "paystack", label: "Paid online (card / M-Pesa via Paystack)" },
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

  const zone = findZone(input.delivery_zone) ?? findZone(DEFAULT_ZONE_ID)!;
  if (zone.id !== "pickup" && !input.address_line1?.trim()) {
    return { ok: false, error: "Please add a delivery address, or choose to pick up in store." };
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

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const delivery_fee = deliveryFeeFor(zone.id);
  const total = subtotal + delivery_fee;

  const order: OrderSummary = {
    reference: reference(),
    items,
    subtotal,
    delivery_fee,
    delivery_label: zone.label,
    total,
    payment_code: (PAYMENT_METHODS[input.payment_method] || PAYMENT_METHODS.delivery).code,
    payment_label: (PAYMENT_METHODS[input.payment_method] || PAYMENT_METHODS.delivery).label,
    payment_status: input.payment_method === "online" ? "Paid online" : "Not paid yet — collect on delivery",
    full_name,
    phone_number,
    email,
    address_line1: input.address_line1?.trim() || undefined,
    city: input.city?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };

  if (input.payment_method === "online") {
    if (!isPaystackConfigured()) {
      return {
        ok: false,
        error: "Online payment is not switched on yet. Please choose “Pay on delivery” — we will confirm on WhatsApp.",
      };
    }

    const started = await initializePaystack({
      email,
      amount: total,
      reference: order.reference,
      callbackUrl: `${await originUrl()}/api/payments/callback`,
      metadata: { customer: full_name, phone: phone_number, delivery: zone.label },
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

  const saved = await recordSale(order);
  if (saved.receipt_no) order.reference = saved.receipt_no;

  jar.delete(CART_COOKIE);

  return {
    ok: true,
    order,
    warning: saved.recorded
      ? undefined
      : `Your order was taken, but it could not be saved to the shop system (${saved.reason}). Send it on WhatsApp so we do not miss it.`,
  };
}

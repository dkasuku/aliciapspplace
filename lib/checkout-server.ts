import type { Cart } from "@/lib/api/types";
import type { OrderSummary } from "@/lib/whatsapp";

export const CART_COOKIE = "alicia_cart";
export const PENDING_ORDER_COOKIE = "alicia_pending_order";
export const LAST_ORDER_COOKIE = "alicia_last_order";

const API_URL = process.env.API_URL || "http://localhost:5000";

export function parseCart(raw: string | undefined): Cart | null {
  if (!raw) return null;
  try {
    const cart = JSON.parse(raw) as Cart;
    return cart.items?.length ? cart : null;
  } catch {
    return null;
  }
}

/**
 * Records the sale on the Flask backend. Best effort on purpose: the order is
 * also delivered over WhatsApp, so a backend that is down or a product that is
 * no longer in the catalogue must not cost the shop a sale.
 */
export async function recordSale(
  order: OrderSummary,
): Promise<{ recorded: boolean; receipt_no?: string; reason?: string }> {
  const items = order.items;
  try {
    const response = await fetch(`${API_URL}/api/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
        payment_method: order.payment_code,
        customer_name: order.full_name,
        customer_phone: order.phone_number,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { recorded: false, reason: payload?.error || `Backend responded with ${response.status}` };
    }

    const sale = (await response.json()) as { receipt_no?: string };
    return { recorded: true, receipt_no: sale.receipt_no };
  } catch (reason) {
    return { recorded: false, reason: reason instanceof Error ? reason.message : "Backend unreachable" };
  }
}

/**
 * Opens the trackable delivery record. Best effort for the same reason as
 * recordSale — a shop system that is down must not block an order.
 */
export async function createDelivery(order: OrderSummary): Promise<{ tracked: boolean; reason?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/deliveries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_ref: order.reference,
        customer_name: order.full_name,
        customer_phone: order.phone_number,
        customer_email: order.email,
        address: order.address_line1,
        city: order.city,
        notes: order.notes,
        lat: order.drop_off?.lat,
        lng: order.drop_off?.lng,
        distance_km: order.delivery_km,
        fulfilment: order.fulfilment,
        delivery_fee: order.delivery_fee,
        subtotal: order.subtotal,
        total: order.total,
        items: order.items,
        payment_method: order.payment_code,
        payment_status: order.payment_status,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { tracked: false, reason: payload?.error || `Backend responded with ${response.status}` };
    }

    return { tracked: true };
  } catch (reason) {
    return { tracked: false, reason: reason instanceof Error ? reason.message : "Backend unreachable" };
  }
}

export async function trackDelivery(
  ref: string,
  phone: string,
): Promise<{ ok: true; delivery: unknown } | { ok: false; error: string; status: number }> {
  try {
    const url = new URL(`${API_URL}/api/deliveries/track`);
    url.searchParams.set("ref", ref);
    url.searchParams.set("phone", phone);

    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: payload?.error || "We could not find that order.",
      };
    }

    return { ok: true, delivery: payload };
  } catch {
    return {
      ok: false,
      status: 503,
      error: "Tracking is briefly unavailable. Please try again, or message us on WhatsApp.",
    };
  }
}

// ── Paystack ─────────────────────────────────────────────────────────────────

const PAYSTACK_API = "https://api.paystack.co";

export function isPaystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export async function initializePaystack(input: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<{ ok: true; authorizationUrl: string } | { ok: false; error: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false, error: "Online payment is not configured yet." };

  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        // Paystack expects the amount in the smallest currency unit.
        amount: Math.round(input.amount * 100),
        currency: "KES",
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: { authorization_url?: string } }
      | null;

    if (!response.ok || !payload?.status || !payload.data?.authorization_url) {
      return { ok: false, error: payload?.message || "Could not start the online payment. Please try again." };
    }

    return { ok: true, authorizationUrl: payload.data.authorization_url };
  } catch {
    return { ok: false, error: "Could not reach the payment provider. Please try again or pay on delivery." };
  }
}

export async function verifyPaystack(
  reference: string,
): Promise<{ paid: boolean; amount?: number; error?: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { paid: false, error: "Online payment is not configured." };

  try {
    const response = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: { status?: string; amount?: number } }
      | null;

    if (!response.ok || !payload?.status) {
      return { paid: false, error: payload?.message || "Could not verify the payment." };
    }

    return {
      paid: payload.data?.status === "success",
      amount: payload.data?.amount != null ? payload.data.amount / 100 : undefined,
      error: payload.data?.status === "success" ? undefined : `Payment status: ${payload.data?.status || "unknown"}`,
    };
  } catch {
    return { paid: false, error: "Could not reach the payment provider to verify the payment." };
  }
}

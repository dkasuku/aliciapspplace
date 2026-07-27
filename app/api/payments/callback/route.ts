import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CART_COOKIE,
  LAST_ORDER_COOKIE,
  PENDING_ORDER_COOKIE,
  recordSale,
  verifyPaystack,
} from "@/lib/checkout-server";
import type { OrderSummary } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Paystack sends the shopper back here after payment. Cookies can only be
 * written from a Route Handler or Server Action, so this verifies, cleans up
 * and then hands off to /checkout/payment for the confirmation screen.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
  const done = (params: Record<string, string>) =>
    NextResponse.redirect(new URL(`/checkout/payment?${new URLSearchParams(params)}`, url.origin));

  if (!reference) return done({ status: "failed", reason: "No payment reference was returned." });

  const jar = await cookies();
  const pending = jar.get(PENDING_ORDER_COOKIE)?.value;
  if (!pending) return done({ status: "failed", reason: "This order has expired. Please check out again." });

  let order: OrderSummary;
  try {
    order = JSON.parse(pending) as OrderSummary;
  } catch {
    return done({ status: "failed", reason: "The order details could not be read. Please check out again." });
  }

  const verified = await verifyPaystack(reference);
  if (!verified.paid) {
    return done({ status: "failed", reason: verified.error || "The payment was not completed." });
  }

  order.payment_reference = reference;
  order.payment_status = "PAID online";

  const saved = await recordSale(order);

  const response = done(
    saved.recorded
      ? { status: "paid" }
      : { status: "paid", warning: `Payment received, but the order could not be saved to the shop system (${saved.reason}).` },
  );

  response.cookies.delete(CART_COOKIE);
  response.cookies.delete(PENDING_ORDER_COOKIE);
  response.cookies.set(LAST_ORDER_COOKIE, JSON.stringify(order), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 900,
    path: "/",
  });

  return response;
}

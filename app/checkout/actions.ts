"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { cart, payments, shipping } from "@/lib/topduka";
import type { CompleteCartInput, ShippingRateRequest } from "@/lib/topduka";

const COOKIE = "topduka_cart_session";

export async function getShippingRates(input: ShippingRateRequest) { return shipping.rates(input); }
export async function startPaystackPayment(email: string, amount: number, callbackUrl: string) {
  if (!email.trim() || !Number.isFinite(amount) || amount <= 0) throw new Error("A valid email and amount are required.");
  return payments.initialize({ email, amount: Math.round(amount * 100), reference: randomUUID(), callback_url: callbackUrl });
}
export async function verifyPaystackPayment(reference: string) {
  if (!reference) throw new Error("Payment reference is missing.");
  return payments.verify({ reference });
}
export async function completeCheckout(input: CompleteCartInput) {
  if (!input.full_name.trim() || !input.email.trim() || !input.phone_number.trim()) throw new Error("Name, email, and phone are required.");
  const jar = await cookies();
  const sessionId = jar.get(COOKIE)?.value;
  if (!sessionId) throw new Error("Your cart session has expired. Please add the products again.");
  const result = await cart.complete(sessionId, input);
  jar.delete(COOKIE);
  return result;
}

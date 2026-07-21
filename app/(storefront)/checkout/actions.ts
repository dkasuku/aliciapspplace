"use server";

import { cookies } from "next/headers";
import type { Cart } from "@/lib/api/types";

const COOKIE = "alicia_cart";
const API_URL = process.env.API_URL || "http://localhost:5000";

export async function completeCheckout(input: {
  full_name: string;
  email: string;
  phone_number: string;
  payment_method: string;
  address_line1?: string;
  city?: string;
  country?: string;
}) {
  if (!input.full_name.trim() || !input.email.trim() || !input.phone_number.trim()) {
    throw new Error("Name, email, and phone are required.");
  }

  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) throw new Error("Your cart is empty. Please add products first.");

  let cart: Cart;
  try {
    cart = JSON.parse(raw) as Cart;
  } catch {
    throw new Error("Your cart is invalid. Please refresh and try again.");
  }

  if (!cart.items?.length) throw new Error("Your cart is empty.");

  const saleData = {
    items: cart.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.name || item.product_name || "Product",
      quantity: item.quantity,
      unit_price: item.unit_price || item.price || 0,
      total: item.total || (item.unit_price || item.price || 0) * item.quantity,
    })),
    payment_method: input.payment_method,
    customer_name: input.full_name,
    customer_phone: input.phone_number,
  };

  let sale;
  try {
    const res = await fetch(`${API_URL}/api/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleData),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Checkout failed" }));
      throw new Error(err.error || `Checkout failed with status ${res.status}`);
    }

    sale = await res.json();
  } catch (err) {
    if (err instanceof Error && err.message !== "Checkout failed") {
      throw new Error(`Unable to reach the server. Please ensure the backend is running. (${err.message})`);
    }
    throw err;
  }

  jar.delete(COOKIE);
  return sale;
}

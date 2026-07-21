import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Cart, CartItem } from "@/lib/api/types";

const COOKIE = "alicia_cart";

function emptyCart(): Cart {
  return { session_id: "", items: [], subtotal: 0, total: 0, item_count: 0 };
}

function readCart(jar: { get: (name: string) => { value: string } | undefined }): Cart {
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return emptyCart();
  try {
    return JSON.parse(raw) as Cart;
  } catch {
    return emptyCart();
  }
}

function writeCart(updated: Cart): NextResponse {
  const response = NextResponse.json(updated);
  response.cookies.set(COOKIE, JSON.stringify(updated), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400,
    path: "/",
  });
  return response;
}

export async function GET() {
  const jar = await cookies();
  return NextResponse.json(readCart(jar));
}

export async function POST(request: Request) {
  const jar = await cookies();
  const cart = readCart(jar);
  const input = (await request.json()) as {
    product_id?: unknown;
    quantity?: unknown;
    product?: {
      name?: string;
      price?: number;
      sales_price?: number | null;
      images?: string[];
    };
  };

  if (typeof input.product_id !== "string" || !Number.isInteger(input.quantity) || Number(input.quantity) < 0) {
    return NextResponse.json({ error: "A product ID and non-negative quantity are required." }, { status: 400 });
  }

  const productId = input.product_id;
  const quantity = Number(input.quantity);
  const items = [...(cart.items || [])];
  const existing = items.find((i) => i.product_id === productId);

  if (quantity === 0) {
    const idx = items.findIndex((i) => i.product_id === productId);
    if (idx >= 0) items.splice(idx, 1);
  } else if (existing) {
    existing.quantity = quantity;
    existing.total = (existing.unit_price || existing.price || 0) * quantity;
  } else {
    const pInfo = input.product;
    const unitPrice = pInfo ? Number(pInfo.sales_price || pInfo.price || 0) : 0;
    items.push({
      product_id: productId,
      name: pInfo?.name || "Product",
      quantity,
      unit_price: unitPrice,
      price: unitPrice,
      total: unitPrice * quantity,
      image: pInfo?.images?.[0] || null,
    } as CartItem);
  }

  const subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
  const updated: Cart = {
    session_id: cart.session_id || `local_${Date.now()}`,
    items,
    subtotal,
    total: subtotal,
    item_count: items.reduce((sum, i) => sum + i.quantity, 0),
  };

  return writeCart(updated);
}

export async function DELETE() {
  const response = NextResponse.json(emptyCart());
  response.cookies.delete(COOKIE);
  return response;
}

import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/admin-session";
import { actorHeaders } from "@/lib/session";
import type { Product } from "@/lib/api/types";

function errorResponse(error: unknown) {
  const status = error instanceof ApiError ? error.status : 502;
  const message = error instanceof Error ? error.message : "Unable to save the product.";
  // A 409 names the product that already exists, so the form can offer a restock.
  const existing = error instanceof ApiError && error.payload && typeof error.payload === "object"
    ? (error.payload as { existing?: unknown }).existing
    : undefined;
  return NextResponse.json({ error: message, existing }, { status });
}

export async function POST(request: Request) {
  // Attendants may add products; the backend files them under their shop.
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  try {
    const data = await request.json() as Partial<Product>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const price = Number(data.price);

    if (!name || !Number.isFinite(price)) {
      return NextResponse.json({ error: "A product name and valid price are required." }, { status: 400 });
    }

    const product = await api.products.create({ ...data, name, price }, actorHeaders(auth.session, auth.shopId));
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

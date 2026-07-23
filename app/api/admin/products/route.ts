import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/lib/api/types";

function errorResponse(error: unknown) {
  const status = error instanceof ApiError ? error.status : 502;
  const message = error instanceof Error ? error.message : "Unable to save the product.";
  return NextResponse.json({ error: message }, { status });
}

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "authenticated";
}

export async function POST(request: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const data = await request.json() as Partial<Product>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const price = Number(data.price);

    if (!name || !Number.isFinite(price)) {
      return NextResponse.json({ error: "A product name and valid price are required." }, { status: 400 });
    }

    const product = await api.products.create({ ...data, name, price });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

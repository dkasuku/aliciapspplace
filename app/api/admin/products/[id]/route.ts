import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/lib/api/types";

function errorResponse(error: unknown) {
  const status = error instanceof ApiError ? error.status : 502;
  const message = error instanceof Error ? error.message : "Unable to update the product.";
  return NextResponse.json({ error: message }, { status });
}

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "authenticated";
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json() as Partial<Product>;
    const product = await api.products.update(id, data);
    return NextResponse.json(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await api.products.delete(id);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

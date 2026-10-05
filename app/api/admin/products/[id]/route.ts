import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/admin-session";
import { actorHeaders } from "@/lib/session";
import type { Product } from "@/lib/api/types";

function errorResponse(error: unknown) {
  const status = error instanceof ApiError ? error.status : 502;
  const message = error instanceof Error ? error.message : "Unable to update the product.";
  return NextResponse.json({ error: message }, { status });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Changing prices or removing products is for the admin only.
  const auth = await requireSession({ manager: true });
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const data = await request.json() as Partial<Product>;
    const product = await api.products.update(id, data, actorHeaders(auth.session, auth.shopId));
    return NextResponse.json(product);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Changing prices or removing products is for the admin only.
  const auth = await requireSession({ manager: true });
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const result = await api.products.delete(id, actorHeaders(auth.session, auth.shopId));
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

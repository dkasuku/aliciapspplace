import { requireSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "http://localhost:5000";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession({ manager: true });
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${API_URL}/api/deliveries/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: (payload as { error?: string } | null)?.error || "Could not update the delivery." },
        { status: response.status },
      );
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "The shop system is unreachable." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession({ manager: true });
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const response = await fetch(`${API_URL}/api/deliveries/${encodeURIComponent(id)}`, {
      method: "DELETE",
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: (payload as { error?: string } | null)?.error || "Could not delete the order." },
        { status: response.status },
      );
    }
    return NextResponse.json(payload ?? { ok: true });
  } catch {
    return NextResponse.json({ error: "The shop system is unreachable." }, { status: 503 });
  }
}

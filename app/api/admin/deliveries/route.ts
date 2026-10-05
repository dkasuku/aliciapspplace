import { requireSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "http://localhost:5000";

export async function GET(request: Request) {
  const auth = await requireSession({ manager: true });
  if ("error" in auth) return auth.error;

  const status = new URL(request.url).searchParams.get("status");
  const target = new URL(`${API_URL}/api/deliveries`);
  if (status) target.searchParams.set("status", status);

  try {
    const response = await fetch(target, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: (payload as { error?: string } | null)?.error || "Could not load deliveries." },
        { status: response.status },
      );
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "The shop system is unreachable." }, { status: 503 });
  }
}

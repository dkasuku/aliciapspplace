import { NextResponse } from "next/server";
import { isPaystackConfigured } from "@/lib/checkout-server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ online_payment_enabled: isPaystackConfigured() });
}

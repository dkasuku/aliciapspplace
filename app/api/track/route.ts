import { NextResponse } from "next/server";
import { trackDelivery } from "@/lib/checkout-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = (searchParams.get("ref") || "").trim();
  const phone = (searchParams.get("phone") || "").trim();

  if (!ref || !phone) {
    return NextResponse.json(
      { error: "Enter both your order number and the phone number you ordered with." },
      { status: 400 },
    );
  }

  const result = await trackDelivery(ref, phone);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result.delivery);
}

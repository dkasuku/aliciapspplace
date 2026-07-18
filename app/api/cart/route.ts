import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cart, TopDukaApiError } from "@/lib/topduka";

const COOKIE = "topduka_cart_session";
const emptyCart = { session_id: "", items: [], subtotal: 0, total: 0, item_count: 0 };

function failure(error: unknown) {
  const status = error instanceof TopDukaApiError && error.status < 500 ? error.status : 502;
  return NextResponse.json({ error: error instanceof Error ? error.message : "Cart request failed." }, { status });
}

export async function GET() {
  try {
    const sessionId = (await cookies()).get(COOKIE)?.value;
    return NextResponse.json(sessionId ? await cart.get(sessionId) : emptyCart);
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as { product_id?: unknown; quantity?: unknown };
    if (typeof input.product_id !== "string" || !Number.isInteger(input.quantity) || Number(input.quantity) < 0) {
      return NextResponse.json({ error: "A product ID and non-negative quantity are required." }, { status: 400 });
    }
    const jar = await cookies();
    let sessionId = jar.get(COOKIE)?.value;
    if (!sessionId) {
      const created = await cart.create();
      sessionId = created.session_id;
    }
    const result = await cart.update(sessionId, { product_id: input.product_id, quantity: Number(input.quantity) });
    const response = NextResponse.json(result);
    response.cookies.set(COOKIE, sessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 86400, path: "/" });
    return response;
  } catch (error) { return failure(error); }
}

export async function DELETE() {
  try {
    const sessionId = (await cookies()).get(COOKIE)?.value;
    if (sessionId) await cart.remove(sessionId);
    const response = NextResponse.json(emptyCart);
    response.cookies.delete(COOKIE);
    return response;
  } catch (error) { return failure(error); }
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/admin-session";
import { SHOP_COOKIE } from "@/lib/session";

/** Switches the shop an owner/admin is working in. Empty id = all shops. */
export async function POST(request: Request) {
  const auth = await requireSession({ manager: true });
  if ("error" in auth) return auth.error;

  const { shopId } = (await request.json()) as { shopId?: string | null };
  const response = NextResponse.json({ ok: true });
  if (shopId) {
    response.cookies.set(SHOP_COOKIE, shopId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    response.cookies.delete(SHOP_COOKIE);
  }
  return response;
}

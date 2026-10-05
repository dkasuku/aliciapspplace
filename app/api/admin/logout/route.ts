import { NextResponse } from "next/server";
import { SESSION_COOKIE, SHOP_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  // Redirect relative to the request so it works on any domain without config.
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(SHOP_COOKIE);
  response.cookies.delete("admin_auth");
  return response;
}

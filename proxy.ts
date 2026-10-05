import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, attendantMayOpen, decodeSession } from "@/lib/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // Attendants only get the till, adding products, restocking and sales.
    if (session.role === "attendant" && !attendantMayOpen(pathname)) {
      return NextResponse.redirect(new URL("/admin/pos", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

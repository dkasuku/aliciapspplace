import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, SHOP_COOKIE, encodeSession, type Session } from "@/lib/session";

const API_URL = process.env.API_URL || "http://localhost:5000";

/**
 * Two ways in: the owner password alone (no username), or a staff
 * username + password created under Users.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as { username?: unknown; password?: unknown };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!password) {
    return NextResponse.json({ error: "Please enter a password." }, { status: 400 });
  }

  let session: Session;
  if (!username) {
    const adminPassword = process.env.ADMIN_PASSWORD || "alicia2026";
    if (password !== adminPassword) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    session = { id: "owner", name: "Owner", role: "owner", shopId: null };
  } else {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        cache: "no-store",
      });
      const user = (await response.json()) as {
        id: string; name: string; role: string; shop_id: string | null; error?: string;
      };
      if (!response.ok) {
        return NextResponse.json({ error: user.error || "Login failed." }, { status: response.status });
      }
      session = {
        id: user.id,
        name: user.name,
        role: user.role === "admin" ? "admin" : "attendant",
        shopId: user.shop_id,
      };
    } catch {
      return NextResponse.json({ error: "The shop system is unreachable." }, { status: 503 });
    }
  }

  const response = NextResponse.json({
    success: true,
    redirect: session.role === "attendant" ? "/admin/pos" : "/admin",
  });
  const cookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(SESSION_COOKIE, encodeSession(session), { ...cookie, maxAge: SESSION_MAX_AGE });
  response.cookies.delete(SHOP_COOKIE);
  // The old single-password cookie is no longer honoured anywhere.
  response.cookies.delete("admin_auth");
  return response;
}

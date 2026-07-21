import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  const adminPassword = process.env.ADMIN_PASSWORD || "alicia2026";

  if (!password) {
    return NextResponse.json({ error: "Please enter a password." }, { status: 400 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_auth", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}

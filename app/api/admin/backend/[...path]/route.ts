import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "http://localhost:5000";

/**
 * Same-origin proxy from the admin UI to the Flask backend.
 *
 * Admin managers used to call `process.env.NEXT_PUBLIC_API_URL` straight from
 * the browser. That variable is not set in production, so those calls fell back
 * to http://localhost:5000 — the shopkeeper's own machine — and every save,
 * restock and adjustment failed silently. Routing through here keeps the calls
 * same-origin, needs no public env var, and enforces the admin cookie.
 */
async function forward(request: Request, path: string[]) {
  if ((await cookies()).get("admin_auth")?.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const incoming = new URL(request.url);
  // Call sites pass the full backend path (e.g. "api/inventory/restock/<id>").
  const target = new URL(`${API_URL.replace(/\/$/, "")}/${path.join("/")}`);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD" && method !== "DELETE";

  try {
    const response = await fetch(target, {
      method,
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "application/json";
    return new NextResponse(text, {
      status: response.status,
      headers: { "content-type": contentType },
    });
  } catch {
    return NextResponse.json({ error: "The shop system is unreachable." }, { status: 503 });
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Ctx) {
  return forward(request, (await params).path);
}
export async function POST(request: Request, { params }: Ctx) {
  return forward(request, (await params).path);
}
export async function PUT(request: Request, { params }: Ctx) {
  return forward(request, (await params).path);
}
export async function PATCH(request: Request, { params }: Ctx) {
  return forward(request, (await params).path);
}
export async function DELETE(request: Request, { params }: Ctx) {
  return forward(request, (await params).path);
}

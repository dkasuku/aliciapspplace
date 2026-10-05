import { NextResponse } from "next/server";
import { requireSession } from "@/lib/admin-session";
import { actorHeaders, attendantMayCall } from "@/lib/session";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "http://localhost:5000";

/**
 * Same-origin proxy from the admin UI to the Flask backend.
 *
 * Admin managers used to call `process.env.NEXT_PUBLIC_API_URL` straight from
 * the browser. That variable is not set in production, so those calls fell back
 * to http://localhost:5000 — the shopkeeper's own machine — and every save,
 * restock and adjustment failed silently. Routing through here keeps the calls
 * same-origin, needs no public env var, and enforces the session.
 *
 * It also stamps every call with who is acting and which shop they're in, and
 * refuses anything an attendant isn't allowed to do.
 */
async function forward(request: Request, path: string[]) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session, shopId } = auth;

  const method = request.method;
  const joined = path.join("/");
  if (session.role === "attendant" && !attendantMayCall(method, joined)) {
    return NextResponse.json({ error: "Only the admin can do that." }, { status: 403 });
  }

  const incoming = new URL(request.url);
  // Call sites pass the full backend path (e.g. "api/inventory/restock/<id>").
  const target = new URL(`${API_URL.replace(/\/$/, "")}/${joined}`);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  // An attendant can't look into another shop by editing the query string.
  if (session.role === "attendant") target.searchParams.delete("shop_id");

  const hasBody = method !== "GET" && method !== "HEAD" && method !== "DELETE";
  const headers: Record<string, string> = actorHeaders(session, shopId);
  if (hasBody) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(target, {
      method,
      headers,
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

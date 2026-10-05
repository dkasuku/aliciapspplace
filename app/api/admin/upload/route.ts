import { requireSession } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL || "http://localhost:5000";

/** Proxies an admin image upload to the backend, which stores it in Backblaze. */
export async function POST(request: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was sent." }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.append("file", file, file.name);

  try {
    const response = await fetch(`${API_URL}/api/uploads`, {
      method: "POST",
      body: outgoing,
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error || "The image could not be uploaded." },
        { status: response.status },
      );
    }
    return NextResponse.json(payload, { status: 201 });
  } catch {
    return NextResponse.json({ error: "The shop system is unreachable." }, { status: 503 });
  }
}

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  try {
    const response = await fetch(`${API_URL}/api/uploads/config`, { cache: "no-store" });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ uploads_enabled: false });
  }
}

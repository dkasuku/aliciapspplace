import { NextResponse } from "next/server";
import { agent, TopDukaApiError } from "@/lib/topduka";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: unknown; session_id?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Enter a message between 1 and 2,000 characters." }, { status: 400 });
    }
    const response = await agent.chat({
      message,
      session_id: typeof body.session_id === "string" ? body.session_id : undefined,
    });
    return NextResponse.json(response);
  } catch (error) {
    const status = error instanceof TopDukaApiError && error.status < 500 ? error.status : 502;
    const message = error instanceof TopDukaApiError ? error.message : "The shopping guide is unavailable.";
    return NextResponse.json({ error: message }, { status });
  }
}

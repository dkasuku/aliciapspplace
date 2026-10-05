import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SHOP_COOKIE,
  actorHeaders,
  decodeSession,
  isManager,
  type Session,
} from "./session";

export async function getSession(): Promise<Session | null> {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * The shop this request works in. Attendants are always in their own shop;
 * managers use whichever one they last switched to (null = all shops).
 */
export async function activeShopId(session: Session | null): Promise<string | null> {
  if (!session) return null;
  if (session.role === "attendant") return session.shopId;
  return (await cookies()).get(SHOP_COOKIE)?.value || null;
}

/** Session + shop + the headers to send to the backend, for server pages. */
export async function adminContext() {
  const session = await getSession();
  const shopId = await activeShopId(session);
  return {
    session,
    shopId,
    manager: isManager(session),
    headers: session ? actorHeaders(session, shopId) : {},
  };
}

/** For API routes: returns a 401/403 response, or the session if allowed. */
export async function requireSession(opts: { manager?: boolean } = {}) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) } as const;
  }
  if (opts.manager && !isManager(session)) {
    return { error: NextResponse.json({ error: "Only the admin can do that." }, { status: 403 }) } as const;
  }
  return { session, shopId: await activeShopId(session) } as const;
}

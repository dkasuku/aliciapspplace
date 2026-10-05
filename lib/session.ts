import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Admin sessions. The cookie carries who is signed in and their role, signed
 * with SESSION_SECRET so an attendant can't edit it into an admin.
 *
 * Roles:
 * - owner:     signed in with ADMIN_PASSWORD. Everything.
 * - admin:     a staff account with full access.
 * - attendant: POS, adding products, restocking, their own shop's sales.
 */

export type Role = "owner" | "admin" | "attendant";

export type Session = {
  id: string;
  name: string;
  role: Role;
  /** Attendants are pinned to this shop. Empty for owner/admin. */
  shopId: string | null;
};

export const SESSION_COOKIE = "admin_session";
/** Which shop an owner/admin is currently working in. */
export const SHOP_COOKIE = "admin_shop";
export const SESSION_MAX_AGE = 60 * 60 * 12;

function secret() {
  return process.env.SESSION_SECRET || `alicia-session:${process.env.ADMIN_PASSWORD || "alicia2026"}`;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(session: Session) {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + SESSION_MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined | null): Session | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session & { exp: number };
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, role: data.role, shopId: data.shopId ?? null };
  } catch {
    return null;
  }
}

export const isManager = (session: Session | null) =>
  session?.role === "owner" || session?.role === "admin";

/** Admin pages an attendant may open. Everything else under /admin is managers only. */
export const ATTENDANT_PAGES = ["/admin/pos", "/admin/products", "/admin/inventory", "/admin/sales"];

export function attendantMayOpen(pathname: string) {
  return ATTENDANT_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

/**
 * Backend calls an attendant may make through the admin proxy. Anything not
 * listed (editing prices, deleting, adjusting stock down, users, shops,
 * the activity log) is refused before it reaches the backend.
 */
const ATTENDANT_API: Array<[string, RegExp]> = [
  ["GET", /^api\/(products(\/[^/]+)?|categories|inventory|inventory\/movements\/[^/]+|sales|shops|stats|uploads\/config)$/],
  ["POST", /^api\/(sales|products|inventory\/restock\/[^/]+)$/],
];

export function attendantMayCall(method: string, path: string) {
  return ATTENDANT_API.some(([m, pattern]) => m === method && pattern.test(path));
}

/** Headers that tell the backend who is acting and in which shop. */
export function actorHeaders(session: Session, shopId: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Actor-Id": session.id,
    // Header values must be Latin-1; strip anything else from display names.
    "X-Actor-Name": session.name.replace(/[^\x20-\x7e]/g, "") || "Staff",
    "X-Actor-Role": session.role,
  };
  if (shopId) headers["X-Shop-Id"] = shopId;
  if (process.env.INTERNAL_API_KEY) headers["X-Internal-Key"] = process.env.INTERNAL_API_KEY;
  return headers;
}

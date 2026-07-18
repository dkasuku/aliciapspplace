import { topdukaRequest } from "./client";
import { routes } from "./routes";
import type { Cart, CartLineInput, CartSession, CompleteCartInput, CreateCartInput } from "./types";

const sessionQuery = (sessionId: string) => ({ session_id: sessionId });

export const cart = {
  get: (sessionId: string) =>
    topdukaRequest<Cart>(routes.cart, { query: sessionQuery(sessionId) }),
  create: (input: CreateCartInput = {}) =>
    topdukaRequest<CartSession | Cart>(routes.cart, { method: "POST", body: input }),
  update: (sessionId: string, item: CartLineInput) =>
    topdukaRequest<Cart>(routes.cartUpdate, {
      method: "POST",
      body: { session_id: sessionId, ...item },
    }),
  complete: (sessionId: string, input: CompleteCartInput) =>
    topdukaRequest<Record<string, unknown>>(routes.cartComplete, {
      method: "POST",
      body: { ...input, session_id: sessionId },
    }),
  clear: (sessionId: string) =>
    topdukaRequest<Record<string, unknown>>(routes.cartClear, {
      method: "POST",
      body: { session_id: sessionId },
    }),
  remove: (sessionId: string) =>
    topdukaRequest<Record<string, unknown>>(routes.cart, {
      method: "DELETE",
      query: sessionQuery(sessionId),
    }),
};

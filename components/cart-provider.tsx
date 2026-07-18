"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/lib/topduka/types";

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  open: boolean;
  error: string | null;
  setOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
}

const emptyCart: Cart = { session_id: "", items: [], subtotal: 0, total: 0, item_count: 0 };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cart");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load the bag.");
      setCart(payload);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load the bag."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/cart").then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load the bag.");
      if (active) { setCart(payload); setError(null); }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load the bag.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = useCallback(async (productId: string, quantity: number) => {
    setLoading(true);
    try {
      const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: productId, quantity }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to update the bag.");
      setCart(payload);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update the bag."); throw reason; }
    finally { setLoading(false); }
  }, []);

  const value = useMemo(() => ({ cart, loading, open, error, setOpen, refresh, update }), [cart, loading, open, error, refresh, update]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

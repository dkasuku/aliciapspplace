"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart } from "@/lib/api/types";

interface ProductInfo {
  name?: string;
  price?: number;
  sales_price?: number | null;
  images?: string[];
}

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  open: boolean;
  error: string | null;
  toast: string | null;
  setOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  update: (productId: string, quantity: number, product?: ProductInfo) => Promise<void>;
}

const emptyCart: Cart = { session_id: "", items: [], subtotal: 0, total: 0, item_count: 0 };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

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

  const update = useCallback(async (productId: string, quantity: number, product?: ProductInfo) => {
    setLoading(true);
    try {
      const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: productId, quantity, product }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to update the bag.");
      setCart(payload);
      setError(null);
      if (quantity > 0 && product?.name) showToast(`${product.name} added to bag`);
      else if (quantity > 0) showToast("Item added to bag");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update the bag."); throw reason; }
    finally { setLoading(false); }
  }, [showToast]);

  const value = useMemo(() => ({ cart, loading, open, error, toast, setOpen, refresh, update }), [cart, loading, open, error, toast, refresh, update]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

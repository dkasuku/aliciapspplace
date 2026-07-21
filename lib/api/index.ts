import "server-only";

import type {
  Category,
  InventoryItem,
  Product,
  Sale,
  SaleItem,
  Stats,
  StockMovement,
  StoreInfo,
} from "./types";

const API_URL = process.env.API_URL || "http://localhost:5000";

class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}/api${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? String(payload.error)
      : `API request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return payload as T;
}

export const api = {
  // Store
  storeInfo: () => request<StoreInfo>("/store"),

  // Categories
  categories: {
    list: () => request<Category[]>("/categories"),
    create: (data: Partial<Category>) => request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) => request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" }),
  },

  // Products
  products: {
    list: (params?: { status?: string; search?: string; category?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      if (params?.search) query.set("search", params.search);
      if (params?.category) query.set("category", params.category);
      const qs = query.toString();
      return request<Product[]>(`/products${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product> & { name: string; price: number }) =>
      request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: boolean }>(`/products/${id}`, { method: "DELETE" }),
  },

  // Inventory
  inventory: {
    list: () => request<InventoryItem[]>("/inventory"),
    restock: (productId: string, quantity: number, reason?: string) =>
      request<Product>(`/inventory/restock/${productId}`, { method: "POST", body: JSON.stringify({ quantity, reason }) }),
    adjust: (productId: string, stock: number, reason?: string) =>
      request<Product>(`/inventory/adjust/${productId}`, { method: "POST", body: JSON.stringify({ stock, reason }) }),
    movements: (productId: string) => request<StockMovement[]>(`/inventory/movements/${productId}`),
  },

  // Sales / POS
  sales: {
    create: (data: { items: SaleItem[]; tax?: number; discount?: number; payment_method?: string; customer_name?: string; customer_phone?: string }) =>
      request<Sale>("/sales", { method: "POST", body: JSON.stringify(data) }),
    list: () => request<Sale[]>("/sales"),
    get: (id: string) => request<Sale>(`/sales/${id}`),
  },

  // Stats
  stats: () => request<Stats>("/stats"),
};

export { ApiError };

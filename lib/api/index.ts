import "server-only";

import type {
  ActivityEntry,
  Category,
  InventoryItem,
  Product,
  Sale,
  SaleItem,
  Shop,
  StaffSummary,
  StaffUser,
  Stats,
  StockMovement,
  StoreInfo,
} from "./types";

const API_URL = process.env.API_URL || "http://localhost:5000";

/** Actor + shop headers from `adminContext()`; omitted on the storefront. */
type Headers = Record<string, string>;

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
    list: (params?: { status?: string; search?: string; category?: string; channel?: "site" | "pos"; product_type?: string }, headers?: Headers) => {
      const query = new URLSearchParams();
      if (params?.status) query.set("status", params.status);
      if (params?.search) query.set("search", params.search);
      if (params?.category) query.set("category", params.category);
      // Omit channel in admin so hidden products stay manageable.
      if (params?.channel) query.set("channel", params.channel);
      if (params?.product_type) query.set("product_type", params.product_type);
      const qs = query.toString();
      return request<Product[]>(`/products${qs ? `?${qs}` : ""}`, { headers });
    },
    get: (id: string) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product> & { name: string; price: number }, headers?: Headers) =>
      request<Product>("/products", { method: "POST", body: JSON.stringify(data), headers }),
    update: (id: string, data: Partial<Product>, headers?: Headers) =>
      request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data), headers }),
    delete: (id: string, headers?: Headers) => request<{ ok: boolean }>(`/products/${id}`, { method: "DELETE", headers }),
  },

  // Inventory
  inventory: {
    list: (headers?: Headers) => request<InventoryItem[]>("/inventory", { headers }),
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
    list: (headers?: Headers) => request<Sale[]>("/sales", { headers }),
    get: (id: string) => request<Sale>(`/sales/${id}`),
  },

  // Stats
  stats: (headers?: Headers) => request<Stats>("/stats", { headers }),

  // Shops, staff and the activity trail
  shops: (headers?: Headers) => request<Shop[]>("/shops", { headers }),
  users: (headers?: Headers) => request<StaffUser[]>("/users", { headers }),
  activity: (params: Record<string, string> = {}, headers?: Headers) =>
    request<ActivityEntry[]>(`/activity?${new URLSearchParams(params)}`, { headers }),
  staffSummary: (headers?: Headers) => request<StaffSummary[]>("/activity/staff-summary", { headers }),
};

export { ApiError };

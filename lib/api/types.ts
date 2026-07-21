export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  price: number;
  sales_price?: number | null;
  currency?: string;
  images?: string[];
  sku?: string | null;
  barcode?: string | null;
  stock?: number;
  low_stock_threshold?: number;
  status?: string;
  categories?: string[];
  product_type?: string;
  rental_terms?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

export interface StoreInfo {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface SaleItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Sale {
  id: string;
  receipt_no: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  payment_method: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  status: string;
  created_at: string;
  items: SaleItem[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  reason?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  low_stock_threshold: number;
  status: string;
  is_low: boolean;
  price: number;
  sales_price?: number | null;
}

export interface Stats {
  total_products: number;
  total_categories: number;
  low_stock: number;
  out_of_stock: number;
  total_sales: number;
  revenue: number;
  today_sales: number;
  today_revenue: number;
}

export interface CartItem {
  product_id: string;
  name?: string;
  product_name?: string;
  quantity: number;
  price?: number;
  unit_price?: number;
  total?: number;
  image?: string | null;
  images?: string[] | null;
}

export interface Cart {
  session_id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  item_count: number;
}

export interface RentalPayment {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  notes?: string;
}

export interface RentalRecord {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  id_number: string;
  id_image?: string;
  total_amount: number;
  amount_paid: number;
  remaining_balance: number;
  daily_payment: number;
  payment_duration_days: number;
  start_date: string;
  expected_end_date: string;
  loan_company?: string;
  status: string;
  payments: RentalPayment[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type UUID = string;

export interface Product {
  id: UUID;
  store_id?: UUID;
  name: string;
  slug?: string;
  description?: string | null;
  price: number | string;
  sales_price?: number | string | null;
  currency?: string;
  images?: string[] | null;
  sku?: string | null;
  stock?: number | null;
  status?: string;
  categories?: string[];
  [key: string]: unknown;
}

export interface Category {
  id: UUID;
  name: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  [key: string]: unknown;
}

export interface ProductFilters {
  id?: UUID;
  sku?: string;
  slug?: string;
  search_term?: string;
  barcode?: string;
  skip?: number;
  limit?: number;
  category_id?: UUID;
  status?: string;
  category?: string;
  collection?: string;
  brand?: string[];
  series?: string[];
  product_type?: string[];
  color?: string[];
  availability?: string[];
  sale?: string[];
  source?: string;
}

export interface CategoryFilters {
  slug?: string;
  is_active?: boolean;
}

export interface CollectionFilters {
  skip?: number;
  limit?: number;
  category?: string;
  brand?: string[];
  series?: string[];
  product_type?: string[];
  color?: string[];
  availability?: string[];
  sale?: string[];
}

export interface CreateBookingInput {
  product_id: UUID;
  starts_at: string;
  party_size: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface Booking {
  id: UUID;
  [key: string]: unknown;
}

export interface CartLineInput {
  product_id: UUID;
  quantity: number;
  [key: string]: unknown;
}

export interface CreateCartInput {
  cart_id?: UUID;
  customer_id?: UUID;
  [key: string]: unknown;
}

export interface CompleteCartInput {
  payment_method: string;
  full_name: string;
  email: string;
  phone_number: string;
  shipping_method_id?: UUID;
  transaction_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  [key: string]: unknown;
}

export interface CartSession {
  session_id: string;
  [key: string]: unknown;
}

export interface Cart extends CartSession {
  items?: CartItem[];
  subtotal?: number | string;
  total?: number | string;
  item_count?: number;
  [key: string]: unknown;
}

export interface CartItem {
  id?: UUID;
  product_id: UUID;
  name?: string;
  product_name?: string;
  quantity: number;
  price?: number | string;
  unit_price?: number | string;
  total?: number | string;
  image?: string | null;
  images?: string[] | null;
  [key: string]: unknown;
}

export interface Order {
  id?: UUID;
  order_number?: number | string;
  status?: string;
  [key: string]: unknown;
}

export interface PaymentConfig {
  cash_enabled?: boolean;
  paystack_configured?: boolean;
  paystack_enabled?: boolean;
  [key: string]: unknown;
}

export interface InitializePaymentInput {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyPaymentInput {
  reference: string;
}

export interface VerifyPaymentResponse {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paid_at: string;
}

export interface StoreInfo {
  id?: UUID;
  name?: string;
  description?: string | null;
  logo?: string | null;
  email?: string | null;
  phone?: string | null;
  currency?: string;
  [key: string]: unknown;
}

export interface StoreConfiguration {
  id?: UUID;
  logo?: string;
  vat_enabled?: boolean;
  vat_rate?: unknown;
  currency_code?: string;
  cash_enabled?: boolean;
  paystack_public_key?: string;
  paystack_configured?: boolean;
  paystack_enabled?: boolean;
  paypal_configured?: boolean;
  stripe_configured?: boolean;
  flutterwave_configured?: boolean;
  mpesa_configured?: boolean;
  pesapal_configured?: boolean;
  [key: string]: unknown;
}

export interface ShippingMethod {
  id: UUID;
  zone_id: UUID;
  name: string;
  type: "flat_rate" | "free_shipping" | "local_pickup" | string;
  price: number | string;
  free_over_amount?: number | string | null;
  is_active?: boolean;
}

export interface ShippingZone {
  id: UUID;
  name: string;
  country?: string | null;
  state_province?: string | null;
  city?: string | null;
  methods?: ShippingMethod[];
  [key: string]: unknown;
}

export interface ShippingAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country: string;
  google_place_id?: string;
  latitude?: number;
  longitude?: number;
}

export interface ShippingRateRequest {
  address: ShippingAddress;
  subtotal: number;
}

export interface ShippingRateResponse {
  zone_id: UUID;
  zone_name: string;
  methods: ShippingMethod[];
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentChatInput {
  message: string;
  session_id?: string;
  messages?: AgentMessage[];
}

export interface AgentChatResponse {
  message: string;
  session_id: string;
  attachments?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

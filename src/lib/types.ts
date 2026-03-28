export type OrderStatus = "processing" | "in_transit" | "delivered" | "cancelled";

export interface Order {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount_code: string | null;
  discount_amount: number;
  total: number;
  payment_method: string | null;
  paystack_ref: string | null;
  shipping_address: { name: string; address: string; city: string; region: string; country: string } | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

export interface Product {
  id: string;
  name: string;
  collection: string;
  price: number;
  description: string | null;
  images: string[];
  stock: number;
  featured: boolean;
  bestseller: boolean;
  created_at: string;
}

export interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "staff";
}

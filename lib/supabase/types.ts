export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  tipo: string;
  ml: number;
  price: number;
  original_price: number;
  discount_pct: number;
  cost_price: number;
  image_url: string;
  description: string;
  stock: number;
  min_stock: number;
  active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  dni: string;
  address: {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  };
  total_orders: number;
  total_spent: number;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMethod =
  | ""
  | "tpv"
  | "paypal"
  | "contrareembolso"
  | "transferencia";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  order_number: number;
  customer_id: string | null;
  customer?: Customer;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  };
  billing_address: {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  };
  notes: string;
  internal_notes: string;
  payment_ref: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  payment_terms: string;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: number;
  supplier_id: string;
  supplier?: Supplier;
  status: "draft" | "sent" | "partial" | "received" | "cancelled";
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string;
  expected_date: string | null;
  received_date: string | null;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  sku: string;
  name: string;
  quantity: number;
  received_qty: number;
  unit_cost: number;
  total: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string | null;
  customer_id: string | null;
  customer?: Customer;
  order?: Order;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  due_date: string | null;
  paid_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  order?: Order;
  tracking_number: string;
  carrier: string;
  status:
    | "pending"
    | "picked_up"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "returned"
    | "failed";
  weight_kg: number;
  estimated_delivery: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product?: Product;
  type: "in" | "out" | "adjustment" | "return";
  quantity: number;
  prev_stock: number;
  new_stock: number;
  reference: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  avgOrderValue: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueToday: number;
}

// -------------------- Order Types --------------------

export interface OrderAddress {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  address1: string[];
  country: string;
  country_name: string;
  state: string | null;
  city: string;
  postcode: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  sku: string;
  type: string;
  name: string;
  product_id: number;
  qty_ordered: number;
  price: string;
  formatted_price: string;
  total: string;
  formatted_total: string;
}

export interface Order {
  id: number;
  increment_id: string;
  status: string;
  status_label: string;
  channel_name: string;
  is_guest: number;
  is_gift: number;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  shipping_method: string | null;
  shipping_title: string | null;
  payment_title: string | null;
  shipping_description: string | null;
  coupon_code: string | null;
  total_item_count: number;
  total_qty_ordered: number;
  base_currency_code: string;
  channel_currency_code: string;
  order_currency_code: string;
  grand_total: string;
  formatted_grand_total: string;
  base_grand_total: string;
  formatted_base_grand_total: string;
  sub_total: string;
  formatted_sub_total: string;
  base_sub_total: string;
  formatted_base_sub_total: string;
  discount_amount: string;
  formatted_discount_amount: string;
  base_discount_amount: string;
  formatted_base_discount_amount: string;
  tax_amount: string;
  formatted_tax_amount: string;
  base_tax_amount: string;
  formatted_base_tax_amount: string;
  shipping_amount: string;
  formatted_shipping_amount: string;
  base_shipping_amount: string;
  formatted_base_shipping_amount: string;
  created_at: string;
  updated_at: string;

  // روابط
  billing_address: OrderAddress | null;
  shipping_address: OrderAddress | null;
  items: OrderItem[];
}
export interface OrdersResponse {
  data: Order[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

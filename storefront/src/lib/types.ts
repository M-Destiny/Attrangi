export interface Product {
  id: string; name: string; sku: string; category: string | null; brand: string | null;
  selling_price: number; stock_level: number; image_url: string | null; created_at: string;
  /** Gallery (main image first). May be empty/missing if the DB migration hasn't run. */
  images: string[];
}
export interface CartLine { product: Product; qty: number }
export interface Customer { name: string; email: string; phone: string; address: string }
export interface OrderResult { invoice_number: string; subtotal: number; discount: number; shipping: number; total: number }
export interface OrderItem { description: string; quantity: number; unit_price: number }
/** Customer-visible order. status = payment status (unpaid|paid|partially_paid|overdue|cancelled). */
export interface TrackedOrder {
  invoice_number: string; status: string; issue_date: string;
  subtotal: number; discount: number; shipping: number; total: number; coupon_code: string | null;
  shipping_status: ShippingStatus; courier: string | null; tracking_number: string | null; tracking_url: string | null;
  payment_method: string | null; items: OrderItem[];
}
export type ShippingStatus = 'pending' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'returned' | 'cancelled';
export interface Quote {
  subtotal: number; discount: number; shipping: number; total: number;
  coupon_code: string | null; coupon_error: string | null; free_shipping_threshold: number; shipping_flat: number;
}
export interface Coupon {
  id: string; code: string; type: 'percent' | 'flat'; value: number; min_order: number;
  starts_at: string | null; expires_at: string | null; max_uses: number | null; one_per_customer: boolean; active: boolean;
  created_at: string; used?: number;
}
export type CouponInput = Omit<Coupon, 'id' | 'created_at' | 'used'> & { id?: string };
export interface AccountData { customer: Customer | null; orders: TrackedOrder[] }
export interface AdminOrder extends TrackedOrder { id: string; created_at: string; payment_reference: string | null; customer: Customer }

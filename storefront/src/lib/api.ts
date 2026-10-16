import { supabase } from './supabase';
import type { Product, Customer, CartLine, OrderResult, TrackedOrder, Quote, Coupon, CouponInput, ShippingStatus } from './types';

/** Pins are not sold on the storefront (also enforced in SQL). */
const visible = (p: Product) => !['pin', 'pins'].includes((p.category ?? '').trim().toLowerCase());
const num = (p: any): Product => ({
  ...p, selling_price: Number(p.selling_price), stock_level: Number(p.stock_level),
  images: [...new Set<string>([p.image_url, ...(p.images ?? [])].filter(Boolean))],
});

/** All in-catalog products (public view; hides cost price). Newest first. */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('storefront_products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(num).filter(visible);
}
export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('storefront_products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  const p = data ? num(data) : null;
  return p && visible(p) ? p : null;
}
const toItems = (lines: CartLine[]) => lines.map(l => ({ product_id: l.product.id, qty: l.qty }));
/** Server-priced totals: subtotal, coupon discount, shipping (free from the threshold after coupon), total. Bad coupon => coupon_error, never throws for that. */
export async function quoteOrder(lines: CartLine[], coupon?: string, phone?: string): Promise<Quote> {
  const { data, error } = await supabase.rpc('quote_order', { p_items: toItems(lines), p_code: coupon || null, p_phone: phone || null });
  if (error) throw new Error(error.message);
  return data as Quote;
}
/** Places an order via the place_order RPC. Throws Error with a user-readable message (e.g. "Only 2 left of X", "This coupon has expired"). */
export async function placeOrder(c: Customer, lines: CartLine[], coupon?: string): Promise<OrderResult> {
  const { data, error } = await supabase.rpc('place_order', {
    p_name: c.name, p_email: c.email, p_phone: c.phone, p_address: c.address,
    p_items: toItems(lines), p_coupon: coupon || null,
  });
  if (error) throw new Error(error.message);
  return data as OrderResult;
}
/** Returns null if no match for invoice number + phone. */
export async function trackOrder(invoiceNumber: string, phone: string): Promise<TrackedOrder | null> {
  const { data, error } = await supabase.rpc('track_order', { p_invoice_number: invoiceNumber, p_phone: phone });
  if (error) throw new Error(error.message);
  return (data as TrackedOrder) ?? null;
}

/** Logged-in customer's saved details (for checkout prefill) and order history. */
export async function getMyAccount(): Promise<import('./types').AccountData> {
  const { data, error } = await supabase.rpc('my_account');
  if (error) throw new Error(error.message);
  return data;
}
/** Staff only: all web (WEB-*) orders, newest first. */
export async function adminOrders(): Promise<import('./types').AdminOrder[]> {
  const { data, error } = await supabase.rpc('admin_orders');
  if (error) throw new Error(error.message);
  return data ?? [];
}
/** Staff only: status in unpaid|paid|partially_paid|overdue|cancelled. Cancelling restores stock. */
export async function adminSetStatus(invoiceNumber: string, status: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_order_status', { p_invoice_number: invoiceNumber, p_status: status });
  if (error) throw new Error(error.message);
}

export interface FulfilmentInput {
  shipping_status: ShippingStatus; courier: string; tracking_number: string; tracking_url: string; payment_method: string; payment_reference: string;
}
/** Staff only: shipping stage + courier/tracking + payment method/reference. */
export async function adminUpdateFulfilment(invoiceNumber: string, f: FulfilmentInput): Promise<void> {
  const { error } = await supabase.rpc('admin_update_fulfilment', {
    p_invoice_number: invoiceNumber, p_shipping_status: f.shipping_status, p_courier: f.courier, p_tracking_number: f.tracking_number,
    p_tracking_url: f.tracking_url, p_payment_method: f.payment_method, p_payment_reference: f.payment_reference,
  });
  if (error) throw new Error(error.message);
}
/** Staff only. */
export async function adminCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.rpc('admin_coupons');
  if (error) throw new Error(error.message);
  return data ?? [];
}
/** Staff only: insert (no id) or update (id). Code is upper-cased/trimmed here. */
export async function saveCoupon(c: CouponInput): Promise<void> {
  const { id, ...rest } = c;
  const row = { ...rest, code: rest.code.trim().toUpperCase() };
  const { error } = id ? await supabase.from('coupons').update(row).eq('id', id) : await supabase.from('coupons').insert(row);
  if (error) throw new Error(error.message.includes('duplicate') ? 'That coupon code already exists' : error.message);
}
export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

-- Attrangii Storefront — additive migration. Run once in Supabase SQL Editor.
-- Reuses existing tables (products, customers, invoices, invoice_items). Creates NO new tables.
-- Public access is limited to: a safe product view, and two SECURITY DEFINER functions.

-- 1. Safe public catalog view (hides buying_price, supplier_id, serial_number).
alter table public.products add column if not exists images text[] not null default '{}';  -- gallery; image_url stays the main image
create or replace view public.storefront_products as
  select id, name, sku, category, brand, selling_price, stock_level, image_url, created_at, images
  from public.products
  where lower(coalesce(category,'')) not in ('pins','pin');  -- Pins are not sold on the storefront
revoke all on public.storefront_products from anon, authenticated;  -- view is auto-updatable & bypasses RLS: allow SELECT only
grant select on public.storefront_products to anon, authenticated;

-- 2. place_order lives in shipping-coupons.sql (run that file last).

-- 3. Track an order: needs invoice number AND the phone used at checkout.
create or replace function public.track_order(p_invoice_number text, p_phone text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'invoice_number', i.invoice_number, 'status', i.status, 'issue_date', i.issue_date,
    'total', i.total_amount,
    'items', coalesce((select jsonb_agg(jsonb_build_object('description', ii.description,
              'quantity', ii.quantity, 'unit_price', ii.unit_price)) from invoice_items ii where ii.invoice_id = i.id), '[]'::jsonb))
  from invoices i join customers c on c.id = i.customer_id
  where i.invoice_number = upper(trim(p_invoice_number)) and c.phone = trim(p_phone);
$$;
grant execute on function public.track_order(text,text) to anon, authenticated;

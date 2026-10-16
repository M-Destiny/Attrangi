-- Attrangii Storefront — shipping, payment details & coupons.
-- Run LAST (order: storefront.sql -> accounts-admin.sql -> shipping-coupons.sql). Safe to re-run.
-- Payment status = existing invoices.status (unpaid/paid/partially_paid/overdue/cancelled), unchanged and CRM-compatible.
-- Shipping rule: fee Rs 80, free when (items - coupon) >= Rs 1500. Change the two numbers in _shipping_fee().

-- 1. Columns on invoices (additive).
alter table public.invoices
  add column if not exists shipping_status text not null default 'pending',
  add column if not exists courier text,
  add column if not exists tracking_number text,
  add column if not exists tracking_url text,
  add column if not exists shipping_fee numeric(10,2) not null default 0,
  add column if not exists coupon_code text,
  add column if not exists payment_method text,
  add column if not exists payment_reference text;
create index if not exists invoices_coupon_code_idx on public.invoices (coupon_code) where coupon_code is not null;

-- 2. Coupons (staff-managed; customers never read this table directly).
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(trim(code)) and length(code) between 3 and 32),
  type text not null check (type in ('percent','flat')),
  value numeric(10,2) not null check (value > 0),
  min_order numeric(10,2) not null default 0 check (min_order >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  one_per_customer boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (type <> 'percent' or value <= 100)
);
alter table public.coupons enable row level security;
drop policy if exists "Staff manage coupons" on public.coupons;
create policy "Staff manage coupons" on public.coupons for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
revoke all on public.coupons from anon;

-- 3. Pricing helpers (internal; not callable from the API).
create or replace function public._shipping_fee(p_net numeric) returns numeric
language sql immutable set search_path = public, pg_temp as $$
  select case when p_net >= 1500 then 0::numeric else 80::numeric end;
$$;

create or replace function public._coupon_discount(p_code text, p_subtotal numeric, p_phone text, p_uid uuid, p_lock boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c coupons%rowtype; v_disc numeric; v_code text := upper(trim(coalesce(p_code,'')));
begin
  if v_code = '' then return jsonb_build_object('code', null, 'discount', 0, 'error', null); end if;
  if p_lock then select * into c from coupons where code = v_code for update;
  else select * into c from coupons where code = v_code; end if;
  if not found or not c.active then return jsonb_build_object('code', v_code, 'discount', 0, 'error', 'Invalid coupon code'); end if;
  if c.starts_at is not null and c.starts_at > now() then return jsonb_build_object('code', v_code, 'discount', 0, 'error', 'This coupon is not active yet'); end if;
  if c.expires_at is not null and c.expires_at < now() then return jsonb_build_object('code', v_code, 'discount', 0, 'error', 'This coupon has expired'); end if;
  if p_subtotal < c.min_order then
    return jsonb_build_object('code', v_code, 'discount', 0, 'error', 'Minimum order of Rs ' || trunc(c.min_order)::text || ' required for this coupon');
  end if;
  if c.max_uses is not null and (select count(*) from invoices where coupon_code = c.code and status <> 'cancelled') >= c.max_uses then
    return jsonb_build_object('code', v_code, 'discount', 0, 'error', 'This coupon has been fully redeemed');
  end if;
  if c.one_per_customer and exists (
       select 1 from invoices i join customers cu on cu.id = i.customer_id
        where i.coupon_code = c.code and i.status <> 'cancelled'
          and ((length(regexp_replace(coalesce(p_phone,''),'\D','','g')) >= 10
            and right(regexp_replace(coalesce(cu.phone,''),'\D','','g'),10) = right(regexp_replace(p_phone,'\D','','g'),10)) or (p_uid is not null and cu.user_id = p_uid))) then
    return jsonb_build_object('code', v_code, 'discount', 0, 'error', 'You have already used this coupon');
  end if;
  v_disc := case c.type when 'percent' then round(p_subtotal * c.value / 100, 2) else least(c.value, p_subtotal) end;
  return jsonb_build_object('code', v_code, 'discount', v_disc, 'error', null);
end $$;
revoke execute on function public._shipping_fee(numeric) from public, anon, authenticated;
revoke execute on function public._coupon_discount(text,numeric,text,uuid,boolean) from public, anon, authenticated;

-- 4. Quote (what the cart/checkout shows). Never fails on a bad coupon: returns coupon_error instead.
create or replace function public.quote_order(p_items jsonb, p_code text default null, p_phone text default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_sub numeric; v_cd jsonb; v_disc numeric; v_ship numeric;
begin
  if coalesce(jsonb_typeof(p_items),'') <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    raise exception 'Cart must have 1-20 items';
  end if;
  select coalesce(sum(p.selling_price * least(greatest(coalesce((e->>'qty')::int, 1), 1), 10)), 0) into v_sub
    from jsonb_array_elements(p_items) e join products p on p.id = (e->>'product_id')::uuid
   where lower(coalesce(p.category,'')) not in ('pins','pin');
  v_cd := public._coupon_discount(p_code, v_sub, null, auth.uid(), false);  -- phone not used here: stops probing whether a phone used a code; place_order enforces it
  v_disc := (v_cd->>'discount')::numeric;
  v_ship := public._shipping_fee(v_sub - v_disc);
  return jsonb_build_object('subtotal', v_sub, 'discount', v_disc, 'shipping', v_ship, 'total', v_sub - v_disc + v_ship,
    'coupon_code', case when v_cd->>'error' is null then v_cd->>'code' end, 'coupon_error', v_cd->>'error',
    'free_shipping_threshold', 1500, 'shipping_flat', 80);
end $$;
revoke execute on function public.quote_order(jsonb,text,text) from public;
grant execute on function public.quote_order(jsonb,text,text) to anon, authenticated;

-- 5. Place an order (supersedes the earlier versions). Prices/discount/shipping are computed server-side.
do $$ declare r record; begin
  for r in select oid::regprocedure as sig from pg_proc where proname = 'place_order' and pronamespace = 'public'::regnamespace loop
    execute 'drop function ' || r.sig;
  end loop;
end $$;
create or replace function public.place_order(
  p_name text, p_email text, p_phone text, p_address text, p_items jsonb, p_coupon text default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_customer uuid; v_invoice uuid; v_number text; v_subtotal numeric := 0; v_cd jsonb; v_disc numeric; v_ship numeric;
  v_item jsonb; v_prod products%rowtype; v_qty int; v_uid uuid := auth.uid();
begin
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_phone),'') = '' or coalesce(trim(p_address),'') = '' then
    raise exception 'Name, phone and address are required';
  end if;
  if coalesce(jsonb_typeof(p_items),'') <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    raise exception 'Cart must have 1-20 items';
  end if;

  if v_uid is not null then select id into v_customer from customers where user_id = v_uid limit 1; end if;
  if v_customer is null then
    insert into customers (name, email, phone, address, user_id)
    values (trim(p_name), nullif(trim(p_email),''), trim(p_phone), trim(p_address), v_uid)
    returning id into v_customer;
  else
    update customers set name = trim(p_name), phone = trim(p_phone), address = trim(p_address),
      email = coalesce(nullif(trim(p_email),''), email) where id = v_customer;
  end if;

  v_number := 'WEB-' || to_char(now(),'YYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text),1,8));
  insert into invoices (invoice_number, customer_id, status, tax_rate, shipping_status)
  values (v_number, v_customer, 'unpaid', 0, 'pending') returning id into v_invoice;

  for v_item in select e from jsonb_array_elements(p_items) e order by e->>'product_id' loop  -- fixed lock order avoids deadlocks
    v_qty := greatest(coalesce((v_item->>'qty')::int, 1), 1);
    if v_qty > 10 then raise exception 'Max 10 per item'; end if;
    select * into v_prod from products where id = (v_item->>'product_id')::uuid for update;
    if not found or v_prod.selling_price is null or lower(coalesce(v_prod.category,'')) in ('pins','pin') then
      raise exception 'Product not found';
    end if;
    if coalesce(v_prod.stock_level,0) < v_qty then raise exception 'Only % left of %', coalesce(v_prod.stock_level,0), v_prod.name; end if;
    insert into invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
    values (v_invoice, v_prod.id, v_prod.name, v_qty, v_prod.selling_price, v_prod.selling_price * v_qty);
    update products set stock_level = stock_level - v_qty, updated_at = now() where id = v_prod.id;
    v_subtotal := v_subtotal + v_prod.selling_price * v_qty;
  end loop;

  v_cd := public._coupon_discount(p_coupon, v_subtotal, p_phone, v_uid, true);
  if coalesce(trim(p_coupon),'') <> '' and v_cd->>'error' is not null then raise exception '%', v_cd->>'error'; end if;
  v_disc := (v_cd->>'discount')::numeric;
  v_ship := public._shipping_fee(v_subtotal - v_disc);

  update invoices set subtotal = v_subtotal, discount_amount = v_disc, shipping_fee = v_ship,
         total_amount = v_subtotal - v_disc + v_ship, coupon_code = v_cd->>'code'
   where id = v_invoice;
  return jsonb_build_object('invoice_number', v_number, 'subtotal', v_subtotal, 'discount', v_disc,
                            'shipping', v_ship, 'total', v_subtotal - v_disc + v_ship);
end $$;
revoke execute on function public.place_order(text,text,text,text,jsonb,text) from public;
grant execute on function public.place_order(text,text,text,text,jsonb,text) to anon, authenticated;

-- 6. Public/customer order shape (shared by tracking, account and admin).
create or replace function public._order_public(i invoices) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'invoice_number', i.invoice_number, 'status', i.status, 'issue_date', i.issue_date,
    'subtotal', i.subtotal, 'discount', i.discount_amount, 'shipping', i.shipping_fee, 'total', i.total_amount,
    'coupon_code', i.coupon_code, 'shipping_status', i.shipping_status, 'courier', i.courier,
    'tracking_number', i.tracking_number, 'tracking_url', i.tracking_url, 'payment_method', i.payment_method,
    'items', coalesce((select jsonb_agg(jsonb_build_object('description', ii.description, 'quantity', ii.quantity, 'unit_price', ii.unit_price))
                       from invoice_items ii where ii.invoice_id = i.id), '[]'::jsonb));
$$;
revoke execute on function public._order_public(invoices) from public, anon, authenticated;

create or replace function public.track_order(p_invoice_number text, p_phone text)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select public._order_public(i) from invoices i join customers c on c.id = i.customer_id
   where i.invoice_number = upper(trim(p_invoice_number)) and c.phone = trim(p_phone);
$$;
grant execute on function public.track_order(text,text) to anon, authenticated;

create or replace function public.my_account() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'customer', (select to_jsonb(c) - 'id' - 'user_id' - 'created_at' from customers c where c.user_id = auth.uid() limit 1),
    'orders', coalesce((select jsonb_agg(public._order_public(i) order by i.issue_date desc, i.invoice_number desc)
                        from invoices i join customers c on c.id = i.customer_id where c.user_id = auth.uid()), '[]'::jsonb));
$$;
revoke execute on function public.my_account() from public, anon;
grant execute on function public.my_account() to authenticated;

-- 7. Admin
create or replace function public.admin_orders() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  return coalesce((select jsonb_agg(public._order_public(i) || jsonb_build_object(
      'id', i.id, 'created_at', i.created_at, 'payment_reference', i.payment_reference,
      'customer', jsonb_build_object('name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address)) order by i.created_at desc)
    from invoices i left join customers c on c.id = i.customer_id where i.invoice_number like 'WEB-%'), '[]'::jsonb);
end $$;
revoke execute on function public.admin_orders() from public, anon;
grant execute on function public.admin_orders() to authenticated;

-- Payment status (invoice status). Cancelling restores stock and cancels shipping; reopening re-takes stock.
create or replace function public.admin_set_order_status(p_invoice_number text, p_status text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inv invoices%rowtype;
begin
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  if p_status is null or p_status not in ('unpaid','paid','partially_paid','overdue','cancelled') then raise exception 'Bad status'; end if;
  select * into v_inv from invoices where invoice_number = p_invoice_number for update;
  if not found then raise exception 'Order not found'; end if;
  if v_inv.status = p_status then return; end if;
  if p_status = 'cancelled' then
    update products p set stock_level = p.stock_level + ii.q
      from (select product_id, sum(quantity) q from invoice_items where invoice_id = v_inv.id group by 1) ii where ii.product_id = p.id;
    update invoices set status = p_status, shipping_status = 'cancelled' where id = v_inv.id;
  else
    if v_inv.status = 'cancelled' then
      update products p set stock_level = greatest(0, p.stock_level - ii.q)
        from (select product_id, sum(quantity) q from invoice_items where invoice_id = v_inv.id group by 1) ii where ii.product_id = p.id;
      update invoices set status = p_status, shipping_status = 'pending' where id = v_inv.id;
    else
      update invoices set status = p_status where id = v_inv.id;
    end if;
  end if;
end $$;
revoke execute on function public.admin_set_order_status(text,text) from public, anon;
grant execute on function public.admin_set_order_status(text,text) to authenticated;

-- Shipping + payment details.
create or replace function public.admin_update_fulfilment(
  p_invoice_number text, p_shipping_status text, p_courier text, p_tracking_number text,
  p_tracking_url text, p_payment_method text, p_payment_reference text
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inv invoices%rowtype;
begin
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  if p_shipping_status is null or p_shipping_status not in ('pending','packed','shipped','out_for_delivery','delivered','returned','cancelled') then
    raise exception 'Bad shipping status';
  end if;
  if nullif(trim(p_payment_method),'') is not null and p_payment_method not in ('upi','bank_transfer','cash','card','other') then
    raise exception 'Bad payment method';
  end if;
  if nullif(trim(p_tracking_url),'') is not null and trim(p_tracking_url) !~* '^https?://[^\s"''<>]+$' then
    raise exception 'Tracking link must start with http:// or https://';
  end if;
  if greatest(length(coalesce(p_courier,'')), length(coalesce(p_tracking_number,'')), length(coalesce(p_tracking_url,'')), length(coalesce(p_payment_reference,''))) > 300 then
    raise exception 'Value too long';
  end if;
  select * into v_inv from invoices where invoice_number = p_invoice_number and invoice_number like 'WEB-%' for update;
  if not found then raise exception 'Order not found'; end if;
  if v_inv.status = 'cancelled' and p_shipping_status <> 'cancelled' then raise exception 'Order is cancelled; reopen it first'; end if;
  if v_inv.status <> 'cancelled' and p_shipping_status = 'cancelled' then raise exception 'Cancel the order (payment status) instead; that restores stock'; end if;
  update invoices set shipping_status = p_shipping_status, courier = nullif(trim(p_courier),''),
         tracking_number = nullif(trim(p_tracking_number),''), tracking_url = nullif(trim(p_tracking_url),''),
         payment_method = nullif(trim(p_payment_method),''), payment_reference = nullif(trim(p_payment_reference),'')
   where id = v_inv.id;
end $$;
revoke execute on function public.admin_update_fulfilment(text,text,text,text,text,text,text) from public, anon;
grant execute on function public.admin_update_fulfilment(text,text,text,text,text,text,text) to authenticated;

-- Coupons list with live usage counts (staff).
create or replace function public.admin_coupons() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  return coalesce((select jsonb_agg(to_jsonb(c) || jsonb_build_object('used',
      (select count(*) from invoices i where i.coupon_code = c.code and i.status <> 'cancelled')) order by c.created_at desc)
    from coupons c), '[]'::jsonb);
end $$;
revoke execute on function public.admin_coupons() from public, anon;
grant execute on function public.admin_coupons() to authenticated;

-- 8. Seed coupon: ATGC10 = 10% off, no minimum, no expiry, unlimited uses, one use per customer. Safe to re-run.
insert into public.coupons (code, type, value, min_order, one_per_customer, active)
values ('ATGC10', 'percent', 10, 0, true, true)
on conflict (code) do nothing;

-- Hide products from the public store only (they stay in the CRM). Safe to re-run.
alter table public.products add column if not exists show_on_storefront boolean not null default true;

update public.products set show_on_storefront = false where sku in (
  'BRICKS-F3022-RED-MASKED-HERO',
  'BRICKS-H-18-BLONDE-GIRL',
  'BUZZ-TOY-STORY',
  'MES-SPIDERMAN-TENTACLES',
  'ZD-DEADPOOL',
  'ZD-WOLVERINE',
  'ZD-MARK85-IRONMAN',
  'SPIDERMAN-ON-STONE',
  'SPIDERMAN-MASK-JAW',
  'MARIO',
  'VALORANT-JET',
  'GENSHIN-IMPACT',
  'GTA',
  'HALO',
  'GOW-GHOST-OF-SPARTA',
  'GOW-STATUE',
  'MARVEL-INFINITY',
  'F1-BLOCKS',
  'POKEBALL-SQUIRTLE',
  'TERMINATOR',
  'PREDATOR'
);

create or replace view public.storefront_products as
  select id, name, sku, category, brand, selling_price, stock_level, image_url, created_at, images
  from public.products
  where show_on_storefront and lower(coalesce(category,'')) not in ('pins','pin');
revoke all on public.storefront_products from anon, authenticated;
grant select on public.storefront_products to anon, authenticated;

create or replace function public.quote_order(p_items jsonb, p_code text default null, p_phone text default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_sub numeric; v_cd jsonb; v_disc numeric; v_ship numeric;
begin
  if coalesce(jsonb_typeof(p_items),'') <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 20 then
    raise exception 'Cart must have 1-20 items';
  end if;
  select coalesce(sum(p.selling_price * least(greatest(coalesce((e->>'qty')::int, 1), 1), 10)), 0) into v_sub
    from jsonb_array_elements(p_items) e join products p on p.id = (e->>'product_id')::uuid
   where p.show_on_storefront and lower(coalesce(p.category,'')) not in ('pins','pin');
  v_cd := public._coupon_discount(p_code, v_sub, null, auth.uid(), false);  -- phone not used here: stops probing whether a phone used a code; place_order enforces it
  v_disc := (v_cd->>'discount')::numeric;
  v_ship := public._shipping_fee(v_sub - v_disc);
  return jsonb_build_object('subtotal', v_sub, 'discount', v_disc, 'shipping', v_ship, 'total', v_sub - v_disc + v_ship,
    'coupon_code', case when v_cd->>'error' is null then v_cd->>'code' end, 'coupon_error', v_cd->>'error',
    'free_shipping_threshold', 1500, 'shipping_flat', 80);
end $$;
revoke execute on function public.quote_order(jsonb,text,text) from public;
grant execute on function public.quote_order(jsonb,text,text) to anon, authenticated;

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
    if not found or v_prod.selling_price is null or not v_prod.show_on_storefront or lower(coalesce(v_prod.category,'')) in ('pins','pin') then
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

-- Email notifications support. Run AFTER shipping-coupons.sql. Idempotent.
alter table public.invoices add column if not exists notified_at timestamptz;

-- Normalises an address for throttling: lower-case, drop "+tag", and (Gmail) drop dots so variants count as one recipient.
create or replace function public.norm_email(e text) returns text language sql immutable set search_path = public, pg_temp as $$
  select case when e is null then null
    when rtrim(split_part(lower(trim(e)), '@', 2), '.') in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(trim(e)), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else split_part(split_part(lower(trim(e)), '@', 1), '+', 1) || '@' || rtrim(split_part(lower(trim(e)), '@', 2), '.') end;
$$;

-- Atomically claims the one-time "new order" notification. Returns order + customer + throttle counters, or null
-- (wrong phone, not a web order, or already notified) so a replay can never send twice. Concurrent claims for the
-- same recipient are serialised with an advisory lock so the per-recipient count cannot be raced.
create or replace function public.claim_order_notification(p_invoice_number text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; r invoices; c customers; v_key text; v_recent int := 0; v_total int := 0;
begin
  select cu.email into v_key from invoices i join customers cu on cu.id = i.customer_id
   where i.invoice_number = upper(trim(p_invoice_number)) and i.invoice_number like 'WEB-%'
     and cu.phone = trim(p_phone) and i.notified_at is null;
  if not found then return null; end if;
  perform pg_advisory_xact_lock(hashtext(coalesce(public.norm_email(v_key), '')));
  update invoices i set notified_at = now()
   from customers cu
   where cu.id = i.customer_id and i.invoice_number = upper(trim(p_invoice_number))
     and i.invoice_number like 'WEB-%' and cu.phone = trim(p_phone) and i.notified_at is null
  returning i.id into v_id;
  if v_id is null then return null; end if;
  select * into r from invoices where id = v_id;
  select * into c from customers where id = r.customer_id;
  if c.email is not null then  -- orders notified to this (normalised) address in the last hour, including this one
    select count(*) into v_recent from invoices i2 join customers c2 on c2.id = i2.customer_id
     where public.norm_email(c2.email) = public.norm_email(c.email) and i2.notified_at > now() - interval '1 hour';
  end if;
  select count(*) into v_total from invoices i3 join customers c3 on c3.id = i3.customer_id
   where i3.notified_at > now() - interval '1 hour' and c3.email is not null;  -- global cap input: only orders that have an email
  return jsonb_build_object('order', public._order_public(r), 'recent_for_email', v_recent, 'recent_total', v_total,
    'customer', jsonb_build_object('name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address));
end $$;
revoke execute on function public.norm_email(text) from public, anon, authenticated;
revoke execute on function public.claim_order_notification(text,text) from public;
grant execute on function public.claim_order_notification(text,text) to anon, authenticated;

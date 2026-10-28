-- Email notifications support. Run AFTER shipping-coupons.sql. Idempotent.
alter table public.invoices add column if not exists notified_at timestamptz;

-- Atomically claims the one-time "new order" notification. Returns order + customer, or null
-- (wrong phone, not a web order, or already notified) so a replay can never send twice.
create or replace function public.claim_order_notification(p_invoice_number text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; r invoices; c customers;
begin
  update invoices i set notified_at = now()
   from customers cu
   where cu.id = i.customer_id and i.invoice_number = upper(trim(p_invoice_number))
     and i.invoice_number like 'WEB-%' and cu.phone = trim(p_phone) and i.notified_at is null
  returning i.id into v_id;
  if v_id is null then return null; end if;
  select * into r from invoices where id = v_id;
  select * into c from customers where id = r.customer_id;
  return jsonb_build_object('order', public._order_public(r),
    'customer', jsonb_build_object('name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address));
end $$;
revoke execute on function public.claim_order_notification(text,text) from public;
grant execute on function public.claim_order_notification(text,text) to anon, authenticated;

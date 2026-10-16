-- Attrangii Storefront — accounts + admin. Run AFTER storefront.sql, once, in the Supabase SQL Editor.
-- WHY the RLS change: the CRM policies grant ALL access to any `authenticated` user, and sign-ups are open.
-- Once customers can register, that would let a customer read/edit every invoice, customer and product.
-- So: every user gets a profile; new sign-ups are always role 'customer'; CRM policies now require a non-customer role.

-- BEFORE RUNNING: `select email, created_at from auth.users;` — everyone listed becomes STAFF below.
--   If any are shop customers who registered while sign-ups were open, set them to 'customer' afterwards.
-- 1. Existing auth users (your CRM team) become staff. New sign-ups become customers.
-- 0. profiles table (from the base CRM schema; it was never created in this project). Safe if it already exists.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text, full_name text, role text default 'customer', updated_at timestamptz default now()
);
alter table public.profiles alter column role set default 'customer';
alter table public.profiles enable row level security;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);  -- role changes are blocked by guard_role below

insert into public.profiles (id, email, role)
  select id, email, 'staff' from auth.users on conflict (id) do nothing;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'customer')  -- role is NEVER taken from client metadata
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 2. Helpers
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role <> 'customer');
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','manager'));
$$;

-- 3. Block role self-escalation (profiles has an "update own profile" policy).
--    Roles can change only from the SQL editor / service role (auth.uid() is null) or by an admin/manager.
create or replace function public.guard_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Not allowed to change role';
  end if;
  return new;
end $$;
drop trigger if exists guard_role on public.profiles;
create trigger guard_role before update on public.profiles for each row execute function public.guard_role_change();

-- 4. Tighten CRM policies: staff only (customers excluded).
do $$ declare t text; pol record; begin
  foreach t in array array['products','invoices','invoice_items','customers','suppliers'] loop
    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;
    execute format('create policy "Staff full access" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- 5. Link customers to accounts (additive column) + let place_order attach the logged-in user.
alter table public.customers add column if not exists user_id uuid references auth.users(id) on delete set null;

-- place_order lives in shipping-coupons.sql (run that file last).

-- 6. Customer: my saved details + orders.
create or replace function public.my_account() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'customer', (select to_jsonb(c) - 'id' - 'user_id' - 'created_at' from customers c where c.user_id = auth.uid() limit 1),
    'orders', coalesce((select jsonb_agg(o order by o.issue_date desc, o.invoice_number desc) from (
        select i.invoice_number, i.status, i.issue_date, i.total_amount as total,
          coalesce((select jsonb_agg(jsonb_build_object('description', ii.description,'quantity', ii.quantity,'unit_price', ii.unit_price))
                    from invoice_items ii where ii.invoice_id = i.id), '[]'::jsonb) as items
        from invoices i join customers c on c.id = i.customer_id where c.user_id = auth.uid()) o), '[]'::jsonb));
$$;
revoke execute on function public.my_account() from public, anon;
grant execute on function public.my_account() to authenticated;

-- 7. Admin: web orders list and status change (restores stock on cancel).
create or replace function public.admin_orders() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Not authorised'; end if;
  return coalesce((select jsonb_agg(o order by o.created_at desc) from (
    select i.id, i.invoice_number, i.status, i.issue_date, i.created_at, i.total_amount as total,
      jsonb_build_object('name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address) as customer,
      coalesce((select jsonb_agg(jsonb_build_object('description', ii.description,'quantity', ii.quantity,'unit_price', ii.unit_price))
                from invoice_items ii where ii.invoice_id = i.id), '[]'::jsonb) as items
    from invoices i left join customers c on c.id = i.customer_id where i.invoice_number like 'WEB-%') o), '[]'::jsonb);
end $$;
revoke execute on function public.admin_orders() from public, anon;
grant execute on function public.admin_orders() to authenticated;

create or replace function public.admin_set_order_status(p_invoice_number text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
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
  elsif v_inv.status = 'cancelled' then
    update products p set stock_level = greatest(0, p.stock_level - ii.q)
      from (select product_id, sum(quantity) q from invoice_items where invoice_id = v_inv.id group by 1) ii where ii.product_id = p.id;
  end if;
  update invoices set status = p_status where id = v_inv.id;
end $$;
revoke execute on function public.admin_set_order_status(text,text) from public, anon;
grant execute on function public.admin_set_order_status(text,text) to authenticated;

-- 8. Hygiene: trigger functions needn't be callable; helpers only for signed-in users (RLS calls is_staff).
revoke execute on function public.handle_new_user(), public.guard_role_change() from public, anon, authenticated;
revoke execute on function public.is_staff(), public.is_admin() from public, anon;
grant execute on function public.is_staff(), public.is_admin() to authenticated;

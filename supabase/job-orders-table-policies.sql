-- Job Orders module schema and policies
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.job_orders (
  id uuid primary key default gen_random_uuid(),
  job_order_code text not null unique,
  job_date date not null default current_date,
  customer_name text not null,
  customer_address text not null,
  vehicle_make text not null,
  plate_number text not null,
  mechanic_id uuid references public.mechanics(id) on delete set null,
  mechanic_name text,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'completed', 'cancelled')),
  work_requested jsonb not null default '[]'::jsonb,
  oil_and_fuels jsonb not null default '[]'::jsonb,
  parts jsonb not null default '[]'::jsonb,
  labor_total numeric(12,2) not null default 0,
  oil_fuel_total numeric(12,2) not null default 0,
  parts_total numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  discount_type text not null default 'none' check (discount_type in ('none', 'fixed', 'percentage')),
  discount_value numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  inventory_consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_orders_code_idx on public.job_orders(job_order_code);
create index if not exists job_orders_status_idx on public.job_orders(status);
create index if not exists job_orders_mechanic_idx on public.job_orders(mechanic_id);
create index if not exists job_orders_created_at_idx on public.job_orders(created_at desc);

create or replace function public.set_job_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_job_orders_updated_at on public.job_orders;
create trigger trg_job_orders_updated_at
before update on public.job_orders
for each row
execute function public.set_job_orders_updated_at();

alter table public.job_orders enable row level security;

-- Read access: authenticated users
create policy "job_orders_select_authenticated"
on public.job_orders
for select
to authenticated
using (true);

-- Write access: admin only
create policy "job_orders_insert_admin"
on public.job_orders
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "job_orders_update_admin"
on public.job_orders
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "job_orders_delete_admin"
on public.job_orders
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

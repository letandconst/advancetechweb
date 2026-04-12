-- Inventory module schema and policies
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  amount integer not null default 0 check (amount >= 0),
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.inventory_items
add column if not exists price numeric(12,2) not null default 0;

create index if not exists inventory_items_category_idx on public.inventory_items(category);
create index if not exists inventory_items_amount_idx on public.inventory_items(amount);
create index if not exists inventory_items_price_idx on public.inventory_items(price);
create index if not exists inventory_items_created_at_idx on public.inventory_items(created_at desc);

create or replace function public.set_inventory_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row
execute function public.set_inventory_items_updated_at();

alter table public.inventory_items enable row level security;

-- Read access: any authenticated user can view inventory
create policy "inventory_items_select_authenticated"
on public.inventory_items
for select
to authenticated
using (true);

-- Write access: admin users only
create policy "inventory_items_insert_admin"
on public.inventory_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "inventory_items_update_admin"
on public.inventory_items
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

create policy "inventory_items_delete_admin"
on public.inventory_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Customers module schema and policies
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

-- ============================================================================
-- 1) Catalog tables for searchable make/model dropdowns
-- ============================================================================

create table if not exists public.vehicle_makes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.vehicle_makes(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (make_id, name)
);

create index if not exists vehicle_models_make_id_idx on public.vehicle_models(make_id);
create index if not exists vehicle_models_name_idx on public.vehicle_models(name);

-- ============================================================================
-- 2) Customer and customer vehicles
-- ============================================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.customer_vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  car_make text not null,
  car_model text not null,
  year integer not null check (year between 1980 and extract(year from now())::int + 1),
  plate_number text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  unique (plate_number)
);

create index if not exists customers_name_idx on public.customers(customer_name);
create index if not exists customers_created_at_idx on public.customers(created_at desc);
create index if not exists customer_vehicles_customer_id_idx on public.customer_vehicles(customer_id);
create index if not exists customer_vehicles_plate_number_idx on public.customer_vehicles(plate_number);

-- ============================================================================
-- 3) Link job orders to customers and selected customer vehicle
-- ============================================================================

alter table public.job_orders
add column if not exists customer_id uuid references public.customers(id) on delete set null,
add column if not exists customer_vehicle_id uuid references public.customer_vehicles(id) on delete set null,
add column if not exists vehicle_model text,
add column if not exists vehicle_year integer check (vehicle_year between 1980 and extract(year from now())::int + 1);

create index if not exists job_orders_customer_id_idx on public.job_orders(customer_id);
create index if not exists job_orders_customer_vehicle_id_idx on public.job_orders(customer_vehicle_id);

-- ============================================================================
-- 4) Updated-at triggers
-- ============================================================================

create or replace function public.set_generic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vehicle_makes_updated_at on public.vehicle_makes;
create trigger trg_vehicle_makes_updated_at
before update on public.vehicle_makes
for each row
execute function public.set_generic_updated_at();

drop trigger if exists trg_vehicle_models_updated_at on public.vehicle_models;
create trigger trg_vehicle_models_updated_at
before update on public.vehicle_models
for each row
execute function public.set_generic_updated_at();

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_generic_updated_at();

drop trigger if exists trg_customer_vehicles_updated_at on public.customer_vehicles;
create trigger trg_customer_vehicles_updated_at
before update on public.customer_vehicles
for each row
execute function public.set_generic_updated_at();

-- ============================================================================
-- 5) Row-level security policies
-- ============================================================================

alter table public.vehicle_makes enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.customers enable row level security;
alter table public.customer_vehicles enable row level security;

-- Vehicle catalog is readable by authenticated users.
create policy "vehicle_makes_select_authenticated"
on public.vehicle_makes
for select
to authenticated
using (true);

create policy "vehicle_models_select_authenticated"
on public.vehicle_models
for select
to authenticated
using (true);

-- Catalog writes restricted to admin users.
create policy "vehicle_makes_insert_admin"
on public.vehicle_makes
for insert
to authenticated
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "vehicle_makes_update_admin"
on public.vehicle_makes
for update
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "vehicle_models_insert_admin"
on public.vehicle_models
for insert
to authenticated
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "vehicle_models_update_admin"
on public.vehicle_models
for update
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Customers and vehicles: authenticated read, admin write/delete.
create policy "customers_select_authenticated"
on public.customers
for select
to authenticated
using (true);

create policy "customers_insert_admin"
on public.customers
for insert
to authenticated
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "customers_update_admin"
on public.customers
for update
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "customers_delete_admin"
on public.customers
for delete
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "customer_vehicles_select_authenticated"
on public.customer_vehicles
for select
to authenticated
using (true);

create policy "customer_vehicles_insert_admin"
on public.customer_vehicles
for insert
to authenticated
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "customer_vehicles_update_admin"
on public.customer_vehicles
for update
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "customer_vehicles_delete_admin"
on public.customer_vehicles
for delete
to authenticated
using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================================
-- 6) Seed common PH-available makes and models (expand anytime)
-- ============================================================================

insert into public.vehicle_makes (name)
values
  ('Toyota'), ('Mitsubishi'), ('Honda'), ('Nissan'), ('Suzuki'), ('Isuzu'),
  ('Ford'), ('Hyundai'), ('Kia'), ('Mazda'), ('Chevrolet'), ('Subaru'),
  ('Volkswagen'), ('BMW'), ('Mercedes-Benz'), ('Geely'), ('Changan'), ('MG'),
  ('GAC'), ('BYD'), ('Foton'), ('Peugeot'), ('Lexus'), ('Audi'), ('Porsche')
on conflict (name) do nothing;

insert into public.vehicle_models (make_id, name)
select vm.id, model_name
from public.vehicle_makes vm
join (
  values
    ('Toyota', 'Vios'), ('Toyota', 'Wigo'), ('Toyota', 'Raize'), ('Toyota', 'Avanza'), ('Toyota', 'Innova'), ('Toyota', 'Hilux'),
    ('Mitsubishi', 'Mirage G4'), ('Mitsubishi', 'Xpander'), ('Mitsubishi', 'Montero Sport'), ('Mitsubishi', 'L300'), ('Mitsubishi', 'Strada'),
    ('Honda', 'City'), ('Honda', 'Civic'), ('Honda', 'Brio'), ('Honda', 'BR-V'), ('Honda', 'HR-V'), ('Honda', 'CR-V'),
    ('Nissan', 'Almera'), ('Nissan', 'Navara'), ('Nissan', 'Terra'),
    ('Suzuki', 'Ertiga'), ('Suzuki', 'Dzire'), ('Suzuki', 'Jimny'), ('Suzuki', 'XL7'),
    ('Isuzu', 'D-Max'), ('Isuzu', 'mu-X'),
    ('Ford', 'Ranger'), ('Ford', 'Everest'), ('Ford', 'Territory'),
    ('Hyundai', 'Accent'), ('Hyundai', 'Stargazer'), ('Hyundai', 'Creta'),
    ('Kia', 'Soluto'), ('Kia', 'Sonet'), ('Kia', 'Seltos'),
    ('Mazda', 'Mazda2'), ('Mazda', 'Mazda3'), ('Mazda', 'CX-5'),
    ('Geely', 'Coolray'), ('Geely', 'Emgrand'),
    ('MG', 'ZS'), ('MG', '5'),
    ('GAC', 'GS3'),
    ('BYD', 'Atto 3'), ('BYD', 'Seal')
) as seed(make_name, model_name)
on vm.name = seed.make_name
on conflict (make_id, name) do nothing;

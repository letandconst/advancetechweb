-- Services module schema and policies
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(12,2) not null check (price >= 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists services_status_idx on public.services(status);
create index if not exists services_created_at_idx on public.services(created_at desc);

create or replace function public.set_services_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row
execute function public.set_services_updated_at();

alter table public.services enable row level security;

-- Read access: authenticated users can view services
create policy "services_select_authenticated"
on public.services
for select
to authenticated
using (true);

-- Write access: admin users only
create policy "services_insert_admin"
on public.services
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

create policy "services_update_admin"
on public.services
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

-- Optional hard-delete policy for maintenance (UI uses soft delete by status)
create policy "services_delete_admin"
on public.services
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

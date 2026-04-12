-- Create inventory_logs table for audit trail
create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  inventory_item_name text not null,
  movement_type text not null check (movement_type in ('restock', 'auto-deduct')),
  quantity_changed numeric(10, 2) not null,
  quantity_before numeric(10, 2) not null,
  quantity_after numeric(10, 2) not null,
  reference_type text not null check (reference_type in ('manual', 'job-order')),
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for faster queries
create index if not exists inventory_logs_inventory_item_id_idx on public.inventory_logs(inventory_item_id);
create index if not exists inventory_logs_created_at_idx on public.inventory_logs(created_at desc);
create index if not exists inventory_logs_movement_type_idx on public.inventory_logs(movement_type);
create index if not exists inventory_logs_reference_id_idx on public.inventory_logs(reference_id);
create index if not exists inventory_logs_created_by_idx on public.inventory_logs(created_by);

-- Enable RLS
alter table public.inventory_logs enable row level security;

-- RLS: Allow authenticated users to read all logs
create policy "Allow authenticated users to read inventory logs" 
  on public.inventory_logs
  for select
  using (auth.role() = 'authenticated');

-- RLS: Allow system (authenticated) to insert logs (internal usage via service role in hooks)
-- In practice, this will be called via the hooks using service role or after triggers
create policy "Allow authenticated users to insert inventory logs" 
  on public.inventory_logs
  for insert
  with check (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
create or replace function public.update_inventory_logs_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger inventory_logs_updated_at_trigger
  before update on public.inventory_logs
  for each row
  execute function public.update_inventory_logs_updated_at();

-- Comments for documentation
comment on table public.inventory_logs is 'Audit trail for all inventory movements (restock and auto-deduction from job orders)';
comment on column public.inventory_logs.movement_type is 'Type of movement: restock (manual addition) or auto-deduct (consumption by job order)';
comment on column public.inventory_logs.quantity_changed is 'Amount added or removed (positive for restock, negative for deduction)';
comment on column public.inventory_logs.reference_type is 'Type of reference: manual (user restock) or job-order (auto-deduct)';
comment on column public.inventory_logs.reference_id is 'ID of job order when reference_type is job-order, otherwise null';

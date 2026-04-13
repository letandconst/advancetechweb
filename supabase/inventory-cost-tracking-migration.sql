-- Inventory Cost Tracking Migration
-- Run this in Supabase SQL Editor to add cost and profit tracking
-- Date: 2026-04-13
-- Status: OPTIONAL - Simple approach (no cost history table)

-- ============================================================================
-- STEP 1: Add cost tracking columns to inventory_items
-- ============================================================================

alter table public.inventory_items
add column if not exists cost numeric(12,2),
add column if not exists unit_type varchar(50) default 'piece',
add column if not exists cost_updated_at timestamptz default now();

-- ============================================================================
-- STEP 2: Add constraints
-- ============================================================================

alter table public.inventory_items
add constraint inventory_cost_non_negative check (cost >= 0);

-- ============================================================================
-- STEP 3: Create function to auto-update cost_updated_at on cost changes
-- ============================================================================

create or replace function public.update_inventory_cost_timestamp()
returns trigger
language plpgsql
as $$
begin
  if new.cost is distinct from old.cost then
    new.cost_updated_at = now();
  end if;
  return new;
end;
$$;

-- ============================================================================
-- STEP 4: Create trigger for cost timestamp
-- ============================================================================

drop trigger if exists trg_update_inventory_cost_timestamp on public.inventory_items;
create trigger trg_update_inventory_cost_timestamp
before update on public.inventory_items
for each row
execute function public.update_inventory_cost_timestamp();

-- ============================================================================
-- STEP 5: Create indexes for performance
-- ============================================================================

-- Index for cost lookups
create index if not exists inventory_cost_idx on public.inventory_items(cost);

-- Index for unit type filtering
create index if not exists inventory_unit_type_idx on public.inventory_items(unit_type);

-- Composite index for profit calculations (useful for TOP X most profitable)
create index if not exists inventory_profit_idx
on public.inventory_items((price - coalesce(cost, 0)) desc)
where cost is not null and amount > 0;

-- ============================================================================
-- STEP 6: Backfill cost data for existing items
-- ============================================================================
-- IMPORTANT: Choose ONE of these options based on your business model:

-- Option A: Estimate cost at 70% of price (30% markup)
-- update public.inventory_items set cost = (price * 0.70) where cost is null;

-- Option B: Cost = price initially (conservative, 0% margin)
-- update public.inventory_items set cost = price where cost is null;

-- Option C: Cost from external data (manually curated)
-- Use this if you have a CSV/import with actual costs
-- Example: update public.inventory_items set cost = ... from imported_costs ic where ...

-- ============================================================================
-- STEP 7: Update RLS policies for cost field
-- ============================================================================

-- Read access: Any authenticated user can view costs
create policy "inventory_items_cost_select_authenticated"
on public.inventory_items
for select
to authenticated
using (true);

-- Update access: Only admin can update cost
drop policy if exists "inventory_cost_update_admin" on public.inventory_items;
create policy "inventory_cost_update_admin"
on public.inventory_items
for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- ============================================================================
-- STEP 8: Verification queries
-- ============================================================================

-- Show summary of cost data
select
  'Cost Data Summary' as metric,
  count(*) as total_items,
  count(*) filter (where cost is not null) as items_with_cost,
  count(*) filter (where cost is null) as items_without_cost,
  min(cost) as min_cost,
  max(cost) as max_cost,
  avg(cost) as avg_cost,
  round(100.0 * count(*) filter (where cost is not null) / count(*), 1) as pct_with_cost
from public.inventory_items;

-- Show sample profit calculations
select
  name,
  category,
  price,
  cost,
  amount,
  round((price - coalesce(cost, price))::numeric, 2) as profit_per_unit,
  round((((price - coalesce(cost, price)) / price) * 100)::numeric, 2) as margin_pct,
  round(((price - coalesce(cost, price)) * amount)::numeric, 2) as total_profit
from public.inventory_items
where amount > 0
order by total_profit desc nulls last
limit 10;

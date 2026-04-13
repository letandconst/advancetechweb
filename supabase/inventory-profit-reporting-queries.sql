-- Inventory Profit & Margin Reporting Queries
-- Use these queries in your reporting dashboard and analytics
-- All queries assume cost column has been added to inventory_items table

-- ============================================================================
-- 1. INDIVIDUAL ITEM PROFITABILITY
-- ============================================================================

-- Get profit metrics for all items currently in stock
select
  id,
  name,
  category,
  price::numeric(10,2) as selling_price,
  cost::numeric(10,2) as unit_cost,
  amount as quantity_in_stock,
  unit_type,
  
  -- Profit calculations
  (price - coalesce(cost, price))::numeric(10,2) as profit_per_unit,
  round(
    (((price - coalesce(cost, price)) / price) * 100)::numeric,
    2
  ) as margin_pct,
  
  -- Inventory values
  (price * amount)::numeric(12,2) as retail_value,
  (coalesce(cost, price) * amount)::numeric(12,2) as cost_value,
  ((price - coalesce(cost, price)) * amount)::numeric(12,2) as total_profit,
  
  cost_updated_at
from public.inventory_items
where amount > 0
order by total_profit desc nulls last;

-- ============================================================================
-- 2. TOP PROFIT GENERATORS (By Category)
-- ============================================================================

-- Most profitable items by absolute profit
select
  id,
  name,
  category,
  profit_per_unit,
  margin_pct,
  quantity,
  total_profit
from (
  select
    id,
    name,
    category,
    (price - coalesce(cost, price))::numeric(10,2) as profit_per_unit,
    round((((price - coalesce(cost, price)) / price) * 100)::numeric, 2) as margin_pct,
    amount as quantity,
    ((price - coalesce(cost, price)) * amount)::numeric(12,2) as total_profit,
    row_number() over (partition by category order by ((price - coalesce(cost, price)) * amount) desc) as rn
  from public.inventory_items
  where amount > 0 and cost is not null
)
where rn <= 5
order by category, total_profit desc;

-- ============================================================================
-- 3. OVERALL BUSINESS MARGIN SUMMARY
-- ============================================================================

-- Overall profitability snapshot
select
  'Overall' as metric_type,
  count(*) as total_items,
  count(*) filter (where cost is not null) as items_with_cost,
  count(*) filter (where amount > 0) as in_stock_items,
  sum(amount) as total_units_in_inventory,
  
  sum(price * amount)::numeric(14,2) as total_retail_value,
  sum(coalesce(cost, price) * amount)::numeric(14,2) as total_cost_value,
  sum((price - coalesce(cost, price)) * amount)::numeric(14,2) as total_profit,
  
  round(
    (sum((price - coalesce(cost, price)) * amount) / sum(price * amount) * 100)::numeric,
    2
  ) as overall_margin_pct
from public.inventory_items;

-- ============================================================================
-- 4. CATEGORY PROFITABILITY BREAKDOWN
-- ============================================================================

-- Profitability by category
select
  category,
  count(*) as item_count,
  count(*) filter (where cost is not null) as items_with_cost,
  sum(amount) as total_units,
  
  avg(price)::numeric(10,2) as avg_selling_price,
  avg(cost)::numeric(10,2) as avg_unit_cost,
  
  sum(price * amount)::numeric(14,2) as category_retail_value,
  sum((price - coalesce(cost, price)) * amount)::numeric(14,2) as category_profit,
  
  round(
    (sum((price - coalesce(cost, price)) * amount) / sum(price * amount) * 100)::numeric,
    2
  ) as category_margin_pct
from public.inventory_items
where cost is not null
group by category
order by category_margin_pct desc;

-- ============================================================================
-- 5. MARGIN DISTRIBUTION ANALYSIS
-- ============================================================================

-- See how many items fall into each margin bracket
with margin_data as (
  select
    name,
    round((((price - coalesce(cost, price)) / price) * 100)::numeric, 1) as margin_pct,
    case
      when (price - coalesce(cost, price)) / price > 0.5 then 'High (>50%)'
      when (price - coalesce(cost, price)) / price >= 0.25 then 'Good (25-50%)'
      when (price - coalesce(cost, price)) / price >= 0.1 then 'Acceptable (10-25%)'
      when (price - coalesce(cost, price)) / price > 0 then 'Low (0-10%)'
      else 'No profit'
    end as margin_bracket
  from public.inventory_items
  where cost is not null
)
select
  margin_bracket,
  count(*) as item_count,
  min(margin_pct) as min_margin,
  max(margin_pct) as max_margin,
  avg(margin_pct)::numeric(5,2) as avg_margin
from margin_data
group by margin_bracket
order by
  case margin_bracket
    when 'High (>50%)' then 1
    when 'Good (25-50%)' then 2
    when 'Acceptable (10-25%)' then 3
    when 'Low (0-10%)' then 4
    when 'No profit' then 5
  end;

-- ============================================================================
-- 6. ITEMS WITH MISSING COST DATA
-- ============================================================================

-- Track which items don't have cost data set
select
  id,
  name,
  category,
  price,
  amount,
  (price * amount)::numeric(12,2) as retail_value,
  'Cost needed' as action
from public.inventory_items
where cost is null
order by (price * amount) desc;

-- ============================================================================
-- 7. LOW MARGIN WARNINGS
-- ============================================================================

-- Items with very low margins that might not be profitable
select
  id,
  name,
  category,
  price::numeric(10,2) as selling_price,
  cost::numeric(10,2) as unit_cost,
  (price - cost)::numeric(10,2) as profit_per_unit,
  round((((price - cost) / price) * 100)::numeric, 2) as margin_pct,
  amount as quantity_in_stock,
  ((price - cost) * amount)::numeric(12,2) as total_profit
from public.inventory_items
where cost is not null
  and (price - cost) / price < 0.15  -- Less than 15% margin
  and amount > 0
order by margin_pct asc;

-- ============================================================================
-- 8. INVENTORY VALUE BREAKDOWN
-- ============================================================================

-- See what portion of inventory value is stock vs profit margin
select
  'Inventory Value Composition' as report,
  sum(coalesce(cost, price) * amount)::numeric(14,2) as cost_of_goods_in_stock,
  sum((price - coalesce(cost, price)) * amount)::numeric(14,2) as profit_margin_in_stock,
  sum(price * amount)::numeric(14,2) as total_retail_value,
  
  round(
    (sum(coalesce(cost, price) * amount) / sum(price * amount) * 100)::numeric,
    2
  ) as pct_is_cost,
  
  round(
    (sum((price - coalesce(cost, price)) * amount) / sum(price * amount) * 100)::numeric,
    2
  ) as pct_is_profit_margin
from public.inventory_items
where amount > 0;

-- ============================================================================
-- 9. COST CHANGE AUDIT (PHASE 2 ONLY - Requires cost_history table)
-- ============================================================================

-- ⚠️  This query requires the advanced approach with cost_history table
-- Only run this if you've implemented inventory_cost_history table (Phase 2)
-- Until then, use query #1 and check cost_updated_at timestamp for simple tracking

/*
-- Show recent cost changes (only if inventory_cost_history table exists)
select
  i.name,
  i.category,
  ich.cost as new_cost,
  (
    select cost
    from public.inventory_cost_history
    where inventory_item_id = i.id
    and created_at < ich.created_at
    order by created_at desc
    limit 1
  ) as previous_cost,
  ich.change_reason,
  ich.created_at as changed_at
from public.inventory_items i
left join public.inventory_cost_history ich on i.id = ich.inventory_item_id
where ich.created_at > now() - interval '30 days'
order by ich.created_at desc;
*/

-- SIMPLE APPROACH ALTERNATIVE: Check cost_updated_at for last change timestamp
-- This works with the simple approach (current Phase 1)
select
  id,
  name,
  category,
  cost::numeric(10,2) as current_cost,
  cost_updated_at as last_updated
from public.inventory_items
where cost is not null
  and cost_updated_at > now() - interval '30 days'
order by cost_updated_at desc;

-- ============================================================================
-- 10. UNIT ECONOMICS BY TYPE
-- ============================================================================

-- Analyze profitability by unit type (pieces, liters, kg, etc.)
select
  coalesce(unit_type, 'undefined') as unit_type,
  count(*) as item_count,
  avg(price)::numeric(10,2) as avg_price,
  avg(cost)::numeric(10,2) as avg_cost,
  round(
    avg((price - coalesce(cost, price)) / price * 100)::numeric,
    2
  ) as avg_margin_pct,
  sum(amount) as total_units,
  sum(amount * (price - coalesce(cost, price)))::numeric(14,2) as total_profit_potential
from public.inventory_items
where cost is not null
group by unit_type
order by total_profit_potential desc;

-- ============================================================================
-- 11. PRICE-TO-COST RATIO ANALYSIS
-- ============================================================================

-- Identify items with unusual price-to-cost ratios
select
  name,
  category,
  cost::numeric(10,2),
  price::numeric(10,2),
  round((price / cost)::numeric, 2) as price_to_cost_ratio,
  case
    when price / cost < 1.5 then 'Very low margin'
    when price / cost < 2 then 'Low margin'
    when price / cost < 3 then 'Normal'
    when price / cost < 5 then 'High margin'
    else 'Very high margin'
  end as assessment
from public.inventory_items
where cost > 0
order by price / cost asc;

-- ============================================================================
-- 12. QUICK SUMMARY FOR DASHBOARD
-- ============================================================================

-- Single query for dashboard KPIs
select
  (select count(*) from public.inventory_items) as total_items,
  (select sum(amount) from public.inventory_items) as total_units,
  (select sum(price * amount)::numeric(14,2) from public.inventory_items where amount > 0) as inventory_value,
  (select sum((price - coalesce(cost, price)) * amount)::numeric(14,2) from public.inventory_items where cost is not null and amount > 0) as potential_profit,
  round(
    (
      select sum((price - coalesce(cost, price)) * amount) / sum(price * amount) * 100
      from public.inventory_items
      where cost is not null and amount > 0
    )::numeric,
    2
  ) as overall_margin_pct,
  (select count(*) from public.inventory_items where cost is null) as items_missing_cost;

/**
 * Inventory Metrics & Profit Calculations
 * 
 * This file provides helpers for calculating profit, margin, and other
 * financial metrics for inventory items.
 * 
 * Use these in your components and reports to ensure consistent
 * profit calculations across the application.
 */

import type { InventoryItem } from '../../types'

/**
 * Represents calculated profit metrics for an inventory item
 */
export interface InventoryMetrics {
  /** Profit per unit sold (price - cost) */
  profit_per_unit: number

  /** Profit margin as percentage: (profit / price) * 100 */
  profit_margin_pct: number

  /** Markup percentage: (profit / cost) * 100 */
  markup_pct: number

  /** Total retail value if all stock sold at current price */
  total_retail_value: number

  /** Total cost value of items in stock */
  total_cost_value: number

  /** Total profit if all items sold at current price */
  total_profit: number

  /** Cost per unit (defaults to price if not set) */
  effective_cost_per_unit: number
}

/**
 * Calculate profit per unit
 * @param sellingPrice - Price customer pays
 * @param cost - Supplier cost per unit (optional, defaults to price)
 * @returns Profit per unit absolute value
 */
export function calculateProfitPerUnit(
  sellingPrice: number,
  cost?: number | null
): number {
  const effectiveCost = cost ?? sellingPrice
  return sellingPrice - effectiveCost
}

/**
 * Calculate profit margin percentage
 * 
 * Formula: (Price - Cost) / Price × 100
 * 
 * @param sellingPrice - Price customer pays
 * @param cost - Supplier cost per unit (optional, defaults to price)
 * @returns Margin as percentage (0-100), or 0 if price is 0
 * 
 * @example
 * // 50% margin
 * calculateMarginPercent(100, 50) // => 50
 * 
 * // 0% margin (cost = price)
 * calculateMarginPercent(100, 100) // => 0
 */
export function calculateMarginPercent(
  sellingPrice: number,
  cost?: number | null
): number {
  if (sellingPrice === 0) return 0
  const effectiveCost = cost ?? sellingPrice
  return ((sellingPrice - effectiveCost) / sellingPrice) * 100
}

/**
 * Calculate markup percentage
 * 
 * Formula: (Price - Cost) / Cost × 100
 * 
 * NOTE: Markup differs from margin:
 * - Margin: profit as % of selling price
 * - Markup: profit as % of cost price
 * 
 * @param sellingPrice - Price customer pays
 * @param cost - Supplier cost per unit (optional, defaults to price)
 * @returns Markup as percentage (0-Infinity), or 0 if cost is 0
 * 
 * @example
 * // 50% markup (same as 33.3% margin)
 * calculateMarkup(100, 50) // => 100
 * 
 * // What you need to mark up a $10 cost to achieve 50% margin
 * // 50 / 10 - 1 = 4 (or 400% markup)
 */
export function calculateMarkupPercent(
  sellingPrice: number,
  cost?: number | null
): number {
  const effectiveCost = cost ?? sellingPrice
  if (effectiveCost === 0) return 0
  return ((sellingPrice - effectiveCost) / effectiveCost) * 100
}

/**
 * Calculate all metrics for an inventory item
 * 
 * @param item - The inventory item with price, cost, and amount
 * @returns Complete metrics object for the item
 * 
 * @example
 * const item: InventoryItem = { 
 *   id: '1', name: 'Widget', price: 50, cost: 30, amount: 100, ... 
 * }
 * const metrics = calculateInventoryMetrics(item)
 * console.log(metrics.profit_margin_pct) // 40
 */
export function calculateInventoryMetrics(item: InventoryItem): InventoryMetrics {
  const effectiveCost = item.cost ?? item.price
  const profitPerUnit = item.price - effectiveCost

  return {
    profit_per_unit: profitPerUnit,
    profit_margin_pct: calculateMarginPercent(item.price, item.cost),
    markup_pct: calculateMarkupPercent(item.price, item.cost),
    total_retail_value: item.price * item.amount,
    total_cost_value: effectiveCost * item.amount,
    total_profit: profitPerUnit * item.amount,
    effective_cost_per_unit: effectiveCost,
  }
}

/**
 * Calculate aggregate metrics for multiple items
 * Useful for reporting and dashboard summaries
 * 
 * @param items - Array of inventory items
 * @returns Aggregated metrics across all items
 */
export function calculateAggregateMetrics(items: InventoryItem[]): {
  total_items: number
  total_units: number
  total_retail_value: number
  total_cost_value: number
  total_profit: number
  overall_margin_pct: number
  items_with_cost: number
  items_without_cost: number
} {
  const itemsWithCost = items.filter(i => i.cost !== null && i.cost !== undefined)
  const itemsWithoutCost = items.filter(i => i.cost === null || i.cost === undefined)

  let totalRetailValue = 0
  let totalCostValue = 0
  let totalUnits = 0

  for (const item of items) {
    const effectiveCost = item.cost ?? item.price
    totalRetailValue += item.price * item.amount
    totalCostValue += effectiveCost * item.amount
    totalUnits += item.amount
  }

  const totalProfit = totalRetailValue - totalCostValue
  const overallMargin =
    totalRetailValue > 0 ? (totalProfit / totalRetailValue) * 100 : 0

  return {
    total_items: items.length,
    total_units: totalUnits,
    total_retail_value: totalRetailValue,
    total_cost_value: totalCostValue,
    total_profit: totalProfit,
    overall_margin_pct: overallMargin,
    items_with_cost: itemsWithCost.length,
    items_without_cost: itemsWithoutCost.length,
  }
}

/**
 * Categorize items by profit margin
 * Useful for identifying high-margin and low-margin products
 * 
 * @param items - Array of inventory items
 * @returns Object with items grouped by margin range
 */
export function categorizeByMargin(items: InventoryItem[]): {
  high_margin: InventoryItem[] // > 50%
  good_margin: InventoryItem[] // 25-50%
  acceptable_margin: InventoryItem[] // 10-25%
  low_margin: InventoryItem[] // 0-10%
  no_profit: InventoryItem[] // <= 0%
  unknown_cost: InventoryItem[] // cost not set
} {
  const result = {
    high_margin: [] as InventoryItem[],
    good_margin: [] as InventoryItem[],
    acceptable_margin: [] as InventoryItem[],
    low_margin: [] as InventoryItem[],
    no_profit: [] as InventoryItem[],
    unknown_cost: [] as InventoryItem[],
  }

  for (const item of items) {
    // Items without cost data
    if (!item.cost) {
      result.unknown_cost.push(item)
      continue
    }

    const margin = calculateMarginPercent(item.price, item.cost)

    if (margin > 50) {
      result.high_margin.push(item)
    } else if (margin >= 25) {
      result.good_margin.push(item)
    } else if (margin >= 10) {
      result.acceptable_margin.push(item)
    } else if (margin > 0) {
      result.low_margin.push(item)
    } else {
      result.no_profit.push(item)
    }
  }

  return result
}

/**
 * Format currency value for display
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted string like "1234.56"
 */
export function formatCurrency(value: number, decimals = 2): string {
  return value.toFixed(decimals)
}

/**
 * Format percentage for display
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default 1)
 * @returns Formatted string like "45.2%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

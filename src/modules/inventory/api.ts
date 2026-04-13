import { supabase } from '../../lib/supabase'
import { ensureNoSupabaseError, getSupabaseDataOrThrow, getSupabaseListOrEmpty, getSupabaseCountOrZero } from '../../lib/supabaseRequest'
import { InventoryFormData, InventoryItem, InventoryLog } from './types'

export async function listInventoryItems(params: {
  page: number
  pageSize: number
  filters: {
    search?: string
    category?: string
    stockState?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
  }
  lowStockThreshold: number
}): Promise<{ items: InventoryItem[]; totalCount: number; page: number; pageSize: number }> {
  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1

  let query = supabase
    .from('inventory_items')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const search = params.filters.search?.trim()
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
  }

  const category = params.filters.category?.trim()
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (params.filters.stockState === 'out-of-stock') {
    query = query.eq('amount', 0)
  } else if (params.filters.stockState === 'low-stock') {
    query = query.gt('amount', 0).lte('amount', params.lowStockThreshold)
  } else if (params.filters.stockState === 'in-stock') {
    query = query.gt('amount', 0)
  }

  const result = await query

  return {
    items: getSupabaseListOrEmpty(result, 'Failed to load inventory items') as InventoryItem[],
    totalCount: getSupabaseCountOrZero(result, 'Failed to count inventory items'),
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function createInventoryItem(payload: InventoryFormData): Promise<InventoryItem> {
  const result = await supabase
    .from('inventory_items')
    .insert(payload)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to create inventory item') as InventoryItem
}

export async function createInventoryItemsBulk(payload: InventoryFormData[]): Promise<InventoryItem[]> {
  if (!payload.length) return []

  const result = await supabase
    .from('inventory_items')
    .insert(payload)
    .select()

  return getSupabaseListOrEmpty(result, 'Failed to bulk create inventory items') as InventoryItem[]
}

export async function updateInventoryItem(payload: Partial<InventoryFormData> & { id: string }): Promise<InventoryItem> {
  const { id, ...updates } = payload

  const result = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to update inventory item') as InventoryItem
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const result = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  ensureNoSupabaseError(result, 'Failed to delete inventory item')
}

export async function adjustInventoryStock(payload: { id: string; delta: number }): Promise<InventoryItem> {
  const currentResult = await supabase
    .from('inventory_items')
    .select('id, amount, name')
    .eq('id', payload.id)
    .single()

  const current = getSupabaseDataOrThrow(currentResult, 'Failed to read inventory item before stock adjustment') as {
    id: string
    amount: number
    name: string
  }

  const currentAmount = current.amount ?? 0
  const nextAmount = Math.max(currentAmount + payload.delta, 0)

  const updateResult = await supabase
    .from('inventory_items')
    .update({ amount: nextAmount })
    .eq('id', payload.id)
    .select()
    .single()

  const updated = getSupabaseDataOrThrow(updateResult, 'Failed to adjust inventory stock') as InventoryItem

  const logResult = await supabase
    .from('inventory_logs')
    .insert({
      inventory_item_id: payload.id,
      inventory_item_name: current.name ?? 'Unknown',
      movement_type: 'restock',
      quantity_changed: payload.delta,
      quantity_before: currentAmount,
      quantity_after: nextAmount,
      reference_type: 'manual',
      reference_id: null,
      notes: payload.delta > 0 ? 'Manual restock' : 'Manual adjustment',
    })

  ensureNoSupabaseError(logResult, 'Failed to log inventory stock adjustment')

  return updated
}

export async function listInventoryLogs(params: {
  inventoryItemId?: string
  limit: number
  offset: number
}): Promise<{ logs: InventoryLog[]; totalCount: number; limit: number; offset: number }> {
  let query = supabase
    .from('inventory_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(params.offset, params.offset + params.limit - 1)

  if (params.inventoryItemId) {
    query = query.eq('inventory_item_id', params.inventoryItemId)
  }

  const result = await query

  return {
    logs: getSupabaseListOrEmpty(result, 'Failed to load inventory logs') as InventoryLog[],
    totalCount: getSupabaseCountOrZero(result, 'Failed to count inventory logs'),
    limit: params.limit,
    offset: params.offset,
  }
}

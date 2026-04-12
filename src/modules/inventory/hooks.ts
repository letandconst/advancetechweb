import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { LOW_STOCK_THRESHOLD } from '../../constants'
import { InventoryFormData, InventoryItem, InventoryLog } from './types'

export interface InventoryFilters {
  search?: string
  category?: string
  stockState?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'
}

export interface InventoryListParams {
  page?: number
  pageSize?: number
  filters?: InventoryFilters
}

export interface InventoryListResult {
  items: InventoryItem[]
  totalCount: number
  page: number
  pageSize: number
}

export function useInventory(params: InventoryListParams = {}) {
  const page = Math.max(params.page ?? 1, 1)
  const pageSize = Math.max(params.pageSize ?? 10, 1)
  const filters = params.filters ?? {}

  return useQuery({
    queryKey: ['inventory', { page, pageSize, filters }],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('inventory_items')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      const search = filters.search?.trim()
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`)
      }

      const category = filters.category?.trim()
      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      if (filters.stockState === 'out-of-stock') {
        query = query.eq('amount', 0)
      } else if (filters.stockState === 'low-stock') {
        query = query.gt('amount', 0).lte('amount', LOW_STOCK_THRESHOLD)
      } else if (filters.stockState === 'in-stock') {
        query = query.gt('amount', 0)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        items: (data ?? []) as InventoryItem[],
        totalCount: count ?? 0,
        page,
        pageSize,
      } as InventoryListResult
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: InventoryFormData) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data as InventoryItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as InventoryItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useAdjustInventoryStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const { data: current, error: fetchError } = await supabase
        .from('inventory_items')
        .select('id, amount, name')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const currentAmount = current?.amount ?? 0
      const nextAmount = Math.max(currentAmount + delta, 0)

      const { data, error } = await supabase
        .from('inventory_items')
        .update({ amount: nextAmount })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Log the restock/adjustment operation
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          inventory_item_id: id,
          inventory_item_name: current?.name ?? 'Unknown',
          movement_type: 'restock',
          quantity_changed: delta,
          quantity_before: currentAmount,
          quantity_after: nextAmount,
          reference_type: 'manual',
          reference_id: null,
          notes: delta > 0 ? 'Manual restock' : 'Manual adjustment',
        })

      if (logError) throw logError

      return data as InventoryItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export interface InventoryLogsParams {
  inventoryItemId?: string
  limit?: number
  offset?: number
}

export function useInventoryLogs(params: InventoryLogsParams = {}) {
  const limit = params.limit ?? 50
  const offset = params.offset ?? 0

  return useQuery({
    queryKey: ['inventory-logs', { inventoryItemId: params.inventoryItemId, limit, offset }],
    queryFn: async () => {
      let query = supabase
        .from('inventory_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (params.inventoryItemId) {
        query = query.eq('inventory_item_id', params.inventoryItemId)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        logs: (data ?? []) as InventoryLog[],
        totalCount: count ?? 0,
        limit,
        offset,
      }
    },
  })
}

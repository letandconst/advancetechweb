import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  adjustInventoryStock,
  createInventoryItem,
  deleteInventoryItem,
  listInventoryItems,
  listInventoryLogs,
  updateInventoryItem,
} from './api'
import { useAppSettings } from '../settings'
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

async function invalidateInventoryRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['inventory'] }),
    queryClient.invalidateQueries({ queryKey: ['inventory-logs'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] }),
    queryClient.invalidateQueries({ queryKey: ['reports-analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['job-orders'] }),
  ])
}

export function useInventory(params: InventoryListParams = {}) {
  const { settings } = useAppSettings()
  const page = Math.max(params.page ?? 1, 1)
  const pageSize = Math.max(params.pageSize ?? 10, 1)
  const filters = params.filters ?? {}

  return useQuery({
    queryKey: queryKeys.inventory({ page, pageSize, filters, lowStockThreshold: settings.lowStockThreshold }),
    queryFn: async () => {
      const result = await listInventoryItems({
        page,
        pageSize,
        filters,
        lowStockThreshold: settings.lowStockThreshold,
      })

      return result as InventoryListResult
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: async () => {
      await invalidateInventoryRelatedQueries(queryClient)
    },
  })
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateInventoryItem,
    onSuccess: async () => {
      await invalidateInventoryRelatedQueries(queryClient)
    },
  })
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: async () => {
      await invalidateInventoryRelatedQueries(queryClient)
    },
  })
}

export function useAdjustInventoryStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adjustInventoryStock,
    onSuccess: async () => {
      await invalidateInventoryRelatedQueries(queryClient)
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
    queryKey: queryKeys.inventoryLogs({ inventoryItemId: params.inventoryItemId, limit, offset }),
    queryFn: async () => {
      const result = await listInventoryLogs({
        inventoryItemId: params.inventoryItemId,
        limit,
        offset,
      })

      return {
        logs: result.logs as InventoryLog[],
        totalCount: result.totalCount,
        limit,
        offset,
      }
    },
  })
}

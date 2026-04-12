import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { supabase } from '../lib/supabase'
import { ensureNoSupabaseError, getSupabaseListOrEmpty } from '../lib/supabaseRequest'
import { useAppSettings } from '../modules/settings'
import { InventoryItem, JobOrder } from '../types'

export interface DashboardStats {
  totalJobOrders: number
  inProgressJobs: number
  completedJobsToday: number
  draftJobs: number
  totalRevenue: number
  revenueMtd: number
  activeMechanics: number
  totalMechanics: number
  lowStockCount: number
  outOfStockCount: number
}

export function useDashboardStats() {
  const { settings } = useAppSettings()

  return useQuery({
    queryKey: queryKeys.dashboardStats(settings.lowStockThreshold),
    queryFn: async () => {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      const [
        totalJobOrdersResult,
        inProgressJobsResult,
        completedTodayResult,
        draftJobsResult,
        revenueResult,
        revenueMtdResult,
        activeMechanicsResult,
        totalMechanicsResult,
        lowStockCountResult,
        outOfStockCountResult,
      ] = await Promise.all([
        supabase.from('job_orders').select('*', { count: 'exact', head: true }),
        supabase.from('job_orders').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('job_orders').select('total').eq('status', 'completed').gte('updated_at', startOfToday),
        supabase.from('job_orders').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('job_orders').select('total').eq('status', 'completed'),
        supabase.from('job_orders').select('total').eq('status', 'completed').gte('updated_at', startOfMonth),
        supabase.from('mechanics').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('mechanics').select('*', { count: 'exact', head: true }),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).gt('amount', 0).lte('amount', settings.lowStockThreshold),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('amount', 0),
      ])

      ensureNoSupabaseError(totalJobOrdersResult, 'Failed to count total job orders')
      ensureNoSupabaseError(inProgressJobsResult, 'Failed to count in-progress job orders')
      ensureNoSupabaseError(completedTodayResult, 'Failed to load completed jobs for today')
      ensureNoSupabaseError(draftJobsResult, 'Failed to count draft job orders')
      ensureNoSupabaseError(revenueResult, 'Failed to load completed revenue rows')
      ensureNoSupabaseError(revenueMtdResult, 'Failed to load month-to-date revenue rows')
      ensureNoSupabaseError(activeMechanicsResult, 'Failed to count active mechanics')
      ensureNoSupabaseError(totalMechanicsResult, 'Failed to count total mechanics')
      ensureNoSupabaseError(lowStockCountResult, 'Failed to count low-stock items')
      ensureNoSupabaseError(outOfStockCountResult, 'Failed to count out-of-stock items')

      const completedTodayRows = getSupabaseListOrEmpty(
        completedTodayResult as { data: { total: number | null }[] | null; error: { message?: string } | null },
        'Failed to parse completed jobs for today'
      )
      const completedRevenueRows = getSupabaseListOrEmpty(
        revenueResult as { data: { total: number | null }[] | null; error: { message?: string } | null },
        'Failed to parse completed revenue rows'
      )
      const monthToDateRevenueRows = getSupabaseListOrEmpty(
        revenueMtdResult as { data: { total: number | null }[] | null; error: { message?: string } | null },
        'Failed to parse month-to-date revenue rows'
      )

      const totalRevenue = completedRevenueRows.reduce((sum, row) => sum + (Number(row.total) || 0), 0)
      const revenueMtd = monthToDateRevenueRows.reduce((sum, row) => sum + (Number(row.total) || 0), 0)
      const completedJobsToday = completedTodayRows.length

      return {
        totalJobOrders: totalJobOrdersResult.count ?? 0,
        inProgressJobs: inProgressJobsResult.count ?? 0,
        completedJobsToday,
        draftJobs: draftJobsResult.count ?? 0,
        totalRevenue,
        revenueMtd,
        activeMechanics: activeMechanicsResult.count ?? 0,
        totalMechanics: totalMechanicsResult.count ?? 0,
        lowStockCount: lowStockCountResult.count ?? 0,
        outOfStockCount: outOfStockCountResult.count ?? 0,
      } as DashboardStats
    },
    refetchInterval: 30_000, // Refresh every 30s
  })
}

export function useRecentJobOrders() {
  return useQuery({
    queryKey: queryKeys.dashboardRecentJobs,
    queryFn: async () => {
      const result = await supabase
        .from('job_orders')
        .select('id, job_order_code, customer_name, vehicle_make, plate_number, mechanic_name, status, total, updated_at')
        .order('updated_at', { ascending: false })
        .limit(6)

      return getSupabaseListOrEmpty(
        result as { data: Pick<JobOrder, 'id' | 'job_order_code' | 'customer_name' | 'vehicle_make' | 'plate_number' | 'mechanic_name' | 'status' | 'total' | 'updated_at'>[] | null; error: { message?: string } | null },
        'Failed to load recent job orders'
      )
    },
    refetchInterval: 30_000,
  })
}

export function useLowStockItems() {
  const { settings } = useAppSettings()

  return useQuery({
    queryKey: queryKeys.dashboardLowStock(settings.lowStockThreshold),
    queryFn: async () => {
      const result = await supabase
        .from('inventory_items')
        .select('id, name, category, amount')
        .lte('amount', settings.lowStockThreshold)
        .order('amount', { ascending: true })
        .limit(5)

      return getSupabaseListOrEmpty(
        result as { data: Pick<InventoryItem, 'id' | 'name' | 'category' | 'amount'>[] | null; error: { message?: string } | null },
        'Failed to load low-stock items'
      )
    },
    refetchInterval: 30_000,
  })
}

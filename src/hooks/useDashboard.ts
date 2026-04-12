import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { LOW_STOCK_THRESHOLD } from '../constants'
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
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

      const [
        { count: totalJobOrders },
        { count: inProgressJobs },
        { data: completedTodayData },
        { count: draftJobs },
        { data: revenueData },
        { data: revenueMtdData },
        { count: activeMechanics },
        { count: totalMechanics },
        { count: lowStockCount },
        { count: outOfStockCount },
      ] = await Promise.all([
        supabase.from('job_orders').select('*', { count: 'exact', head: true }),
        supabase.from('job_orders').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('job_orders').select('total').eq('status', 'completed').gte('updated_at', startOfToday),
        supabase.from('job_orders').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('job_orders').select('total').eq('status', 'completed'),
        supabase.from('job_orders').select('total').eq('status', 'completed').gte('updated_at', startOfMonth),
        supabase.from('mechanics').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('mechanics').select('*', { count: 'exact', head: true }),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).gt('amount', 0).lte('amount', LOW_STOCK_THRESHOLD),
        supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('amount', 0),
      ])

      const totalRevenue = (revenueData ?? []).reduce((sum, row) => sum + (Number(row.total) || 0), 0)
      const revenueMtd = (revenueMtdData ?? []).reduce((sum, row) => sum + (Number(row.total) || 0), 0)
      const completedJobsToday = completedTodayData?.length ?? 0

      return {
        totalJobOrders: totalJobOrders ?? 0,
        inProgressJobs: inProgressJobs ?? 0,
        completedJobsToday,
        draftJobs: draftJobs ?? 0,
        totalRevenue,
        revenueMtd,
        activeMechanics: activeMechanics ?? 0,
        totalMechanics: totalMechanics ?? 0,
        lowStockCount: lowStockCount ?? 0,
        outOfStockCount: outOfStockCount ?? 0,
      } as DashboardStats
    },
    refetchInterval: 30_000, // Refresh every 30s
  })
}

export function useRecentJobOrders() {
  return useQuery({
    queryKey: ['dashboard-recent-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_orders')
        .select('id, job_order_code, customer_name, vehicle_make, plate_number, mechanic_name, status, total, updated_at')
        .order('updated_at', { ascending: false })
        .limit(6)

      if (error) throw error
      return (data ?? []) as Pick<JobOrder, 'id' | 'job_order_code' | 'customer_name' | 'vehicle_make' | 'plate_number' | 'mechanic_name' | 'status' | 'total' | 'updated_at'>[]
    },
    refetchInterval: 30_000,
  })
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, category, amount')
        .lte('amount', LOW_STOCK_THRESHOLD)
        .order('amount', { ascending: true })
        .limit(5)

      if (error) throw error
      return (data ?? []) as Pick<InventoryItem, 'id' | 'name' | 'category' | 'amount'>[]
    },
    refetchInterval: 30_000,
  })
}

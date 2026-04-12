import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { InventoryLog, JobOrder, JobOrderWorkItem } from '../../types'
import {
  ReportsAnalyticsResult,
  ReportsDateRange,
  ReportsFilters,
  ReportsInventoryLogRow,
  ReportsInventoryMovementPoint,
  ReportsPeriod,
  ReportsServicePoint,
  ReportsStatusPoint,
  ReportsSummary,
  ReportsTrendPoint,
} from './types'

type JobOrderReference = Pick<JobOrder, 'id' | 'job_order_code'>

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatMonthInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

function toIsoRange(start: Date, end: Date) {
  return {
    start: new Date(start.getTime() - start.getTimezoneOffset() * 60_000).toISOString(),
    end: new Date(end.getTime() - end.getTimezoneOffset() * 60_000).toISOString(),
  }
}

function formatRangeLabel(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-PH', options).format(date)
}

export function createDefaultReportsFilters(now = new Date()): ReportsFilters {
  return {
    period: 'month',
    day: formatDateInput(now),
    month: formatMonthInput(now),
    year: String(now.getFullYear()),
    startDate: formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: formatDateInput(now),
  }
}

export function resolveReportsDateRange(filters: ReportsFilters): ReportsDateRange {
  const fallback = createDefaultReportsFilters()
  const period = filters.period ?? fallback.period

  if (period === 'day') {
    const [year, month, day] = (filters.day || fallback.day).split('-').map(Number)
    const start = new Date(year, month - 1, day, 0, 0, 0, 0)
    const end = new Date(year, month - 1, day, 23, 59, 59, 999)
    const range = toIsoRange(start, end)

    return {
      start: range.start,
      end: range.end,
      label: formatRangeLabel(start, { month: 'long', day: 'numeric', year: 'numeric' }),
      bucket: 'hour',
    }
  }

  if (period === 'month') {
    const [year, month] = (filters.month || fallback.month).split('-').map(Number)
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const end = new Date(year, month, 0, 23, 59, 59, 999)
    const range = toIsoRange(start, end)

    return {
      start: range.start,
      end: range.end,
      label: formatRangeLabel(start, { month: 'long', year: 'numeric' }),
      bucket: 'day',
    }
  }

  if (period === 'year') {
    const year = Number(filters.year || fallback.year)
    const start = new Date(year, 0, 1, 0, 0, 0, 0)
    const end = new Date(year, 11, 31, 23, 59, 59, 999)
    const range = toIsoRange(start, end)

    return {
      start: range.start,
      end: range.end,
      label: String(year),
      bucket: 'month',
    }
  }

  const rawStart = filters.startDate || fallback.startDate
  const rawEnd = filters.endDate || rawStart
  const [startYear, startMonth, startDay] = rawStart.split('-').map(Number)
  const [endYear, endMonth, endDay] = rawEnd.split('-').map(Number)
  const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0)
  const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999)
  const normalizedStart = startDate <= endDate ? startDate : endDate
  const normalizedEnd = endDate >= startDate ? endDate : startDate
  const range = toIsoRange(normalizedStart, normalizedEnd)
  const diffDays = Math.max(1, Math.ceil((normalizedEnd.getTime() - normalizedStart.getTime()) / 86_400_000) + 1)

  return {
    start: range.start,
    end: range.end,
    label: `${formatRangeLabel(normalizedStart, { month: 'short', day: 'numeric', year: 'numeric' })} - ${formatRangeLabel(normalizedEnd, { month: 'short', day: 'numeric', year: 'numeric' })}`,
    bucket: diffDays > 62 ? 'month' : 'day',
  }
}

function formatBucketLabel(date: Date, bucket: ReportsDateRange['bucket']) {
  if (bucket === 'hour') {
    return new Intl.DateTimeFormat('en-PH', { hour: 'numeric' }).format(date)
  }

  if (bucket === 'month') {
    return new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(date)
  }

  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(date)
}

function formatBucketKey(date: Date, bucket: ReportsDateRange['bucket']) {
  if (bucket === 'hour') {
    return `${formatDateInput(date)}T${pad(date.getHours())}`
  }

  if (bucket === 'month') {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
  }

  return formatDateInput(date)
}

function addBucketStep(cursor: Date, bucket: ReportsDateRange['bucket']) {
  const next = new Date(cursor)

  if (bucket === 'hour') {
    next.setHours(next.getHours() + 1)
    return next
  }

  if (bucket === 'month') {
    next.setMonth(next.getMonth() + 1)
    return next
  }

  next.setDate(next.getDate() + 1)
  return next
}

function createTrendSeed(range: ReportsDateRange) {
  const start = new Date(range.start)
  const end = new Date(range.end)
  const seed = new Map<string, ReportsTrendPoint>()

  for (let cursor = new Date(start); cursor <= end; cursor = addBucketStep(cursor, range.bucket)) {
    const key = formatBucketKey(cursor, range.bucket)
    seed.set(key, {
      key,
      label: formatBucketLabel(cursor, range.bucket),
      jobs: 0,
      completedJobs: 0,
      revenue: 0,
    })
  }

  return seed
}

function createInventoryMovementSeed(range: ReportsDateRange) {
  const start = new Date(range.start)
  const end = new Date(range.end)
  const seed = new Map<string, ReportsInventoryMovementPoint>()

  for (let cursor = new Date(start); cursor <= end; cursor = addBucketStep(cursor, range.bucket)) {
    const key = formatBucketKey(cursor, range.bucket)
    seed.set(key, {
      key,
      label: formatBucketLabel(cursor, range.bucket),
      autoDeducted: 0,
      restocked: 0,
    })
  }

  return seed
}

function createRecentInventoryMovementRange(now = new Date()): ReportsDateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  const range = toIsoRange(start, end)

  return {
    start: range.start,
    end: range.end,
    label: 'Last 3 days',
    bucket: 'day',
  }
}

function deriveStatusBreakdown(jobOrders: JobOrder[]): ReportsStatusPoint[] {
  const counts = jobOrders.reduce<Record<string, number>>((acc, jobOrder) => {
    acc[jobOrder.status] = (acc[jobOrder.status] ?? 0) + 1
    return acc
  }, {})

  return [
    { status: 'completed', label: 'Completed', count: counts.completed ?? 0 },
    { status: 'in_progress', label: 'In Progress', count: counts.in_progress ?? 0 },
    { status: 'draft', label: 'Draft', count: counts.draft ?? 0 },
    { status: 'cancelled', label: 'Cancelled', count: counts.cancelled ?? 0 },
  ]
}

function deriveTopServices(jobOrders: JobOrder[]): ReportsServicePoint[] {
  const grouped = new Map<string, ReportsServicePoint>()

  jobOrders.forEach((jobOrder) => {
    const services = Array.isArray(jobOrder.work_requested) ? jobOrder.work_requested : []

    services.forEach((service: JobOrderWorkItem) => {
      const entry = grouped.get(service.service_name) ?? {
        serviceName: service.service_name,
        jobs: 0,
        revenue: 0,
      }

      entry.jobs += 1
      entry.revenue += Number(service.amount) || 0
      grouped.set(service.service_name, entry)
    })
  })

  return [...grouped.values()]
    .sort((left, right) => right.revenue - left.revenue || right.jobs - left.jobs)
    .slice(0, 6)
}

function deriveSummary(jobOrders: JobOrder[], inventoryLogs: InventoryLog[]): ReportsSummary {
  const completedJobs = jobOrders.filter((jobOrder) => jobOrder.status === 'completed')
  const inProgressJobs = jobOrders.filter((jobOrder) => jobOrder.status === 'in_progress').length
  const cancelledJobs = jobOrders.filter((jobOrder) => jobOrder.status === 'cancelled').length
  const totalRevenue = completedJobs.reduce((sum, jobOrder) => sum + (Number(jobOrder.total) || 0), 0)
  const partsRevenue = completedJobs.reduce((sum, jobOrder) => sum + (Number(jobOrder.parts_total) || 0), 0)
  const oilRevenue = completedJobs.reduce((sum, jobOrder) => sum + (Number(jobOrder.oil_fuel_total) || 0), 0)
  const laborRevenue = completedJobs.reduce((sum, jobOrder) => sum + (Number(jobOrder.labor_total) || 0), 0)
  const discountsGiven = completedJobs.reduce((sum, jobOrder) => sum + (Number(jobOrder.discount_amount) || 0), 0)
  const autoDeductedUnits = inventoryLogs
    .filter((log) => log.movement_type === 'auto-deduct')
    .reduce((sum, log) => sum + Math.abs(Number(log.quantity_changed) || 0), 0)
  const restockedUnits = inventoryLogs
    .filter((log) => log.movement_type === 'restock')
    .reduce((sum, log) => sum + Math.abs(Number(log.quantity_changed) || 0), 0)

  return {
    totalJobs: jobOrders.length,
    completedJobs: completedJobs.length,
    inProgressJobs,
    cancelledJobs,
    completionRate: jobOrders.length ? (completedJobs.length / jobOrders.length) * 100 : 0,
    totalRevenue,
    averageTicket: completedJobs.length ? totalRevenue / completedJobs.length : 0,
    partsRevenue,
    oilRevenue,
    laborRevenue,
    discountsGiven,
    inventoryMovements: inventoryLogs.length,
    autoDeductedUnits,
    restockedUnits,
  }
}

function deriveRevenueTrend(jobOrders: JobOrder[], range: ReportsDateRange) {
  const seed = createTrendSeed(range)

  jobOrders.forEach((jobOrder) => {
    const createdAt = new Date(jobOrder.created_at)
    const bucketKey = formatBucketKey(createdAt, range.bucket)
    const entry = seed.get(bucketKey)

    if (!entry) return

    entry.jobs += 1

    if (jobOrder.status === 'completed') {
      entry.completedJobs += 1
      entry.revenue += Number(jobOrder.total) || 0
    }
  })

  return [...seed.values()]
}

function deriveInventoryMovementTrend(inventoryLogs: InventoryLog[], range: ReportsDateRange) {
  const seed = createInventoryMovementSeed(range)

  inventoryLogs.forEach((log) => {
    const createdAt = new Date(log.created_at)
    const bucketKey = formatBucketKey(createdAt, range.bucket)
    const entry = seed.get(bucketKey)

    if (!entry) return

    const quantity = Math.abs(Number(log.quantity_changed) || 0)

    if (log.movement_type === 'auto-deduct') {
      entry.autoDeducted += quantity
      return
    }

    entry.restocked += quantity
  })

  return [...seed.values()]
}

function resolveInventoryReferenceLabel(log: InventoryLog, jobOrderCodeMap: Map<string, string>) {
  if (log.reference_type === 'job-order') {
    const code = log.reference_label || (log.reference_id ? jobOrderCodeMap.get(log.reference_id) : null)
    return code || 'Job order'
  }

  return log.reference_label || 'Manual adjustment'
}

function deriveInventoryLogs(inventoryLogs: InventoryLog[], jobOrderCodeMap: Map<string, string>): ReportsInventoryLogRow[] {
  return inventoryLogs
    .map((log) => ({
      ...log,
      absoluteQuantity: Math.abs(Number(log.quantity_changed) || 0),
      referenceDisplay: resolveInventoryReferenceLabel(log, jobOrderCodeMap),
    }))
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
}

function normalizeJobOrders(rows: Partial<JobOrder>[]) {
  return (rows ?? []) as JobOrder[]
}

function normalizeInventoryLogs(rows: Partial<InventoryLog>[]) {
  return (rows ?? []) as InventoryLog[]
}

export function useReportsAnalytics(filters: ReportsFilters) {
  const range = resolveReportsDateRange(filters)
  const recentMovementRange = createRecentInventoryMovementRange()

  return useQuery({
    queryKey: ['reports-analytics', filters, range],
    queryFn: async () => {
      const [jobOrdersResult, inventoryLogsResult, recentInventoryLogsResult] = await Promise.all([
        supabase
          .from('job_orders')
          .select('id, job_order_code, customer_name, mechanic_name, status, total, parts_total, oil_fuel_total, labor_total, discount_amount, work_requested, created_at, updated_at, job_date')
          .gte('created_at', range.start)
          .lte('created_at', range.end)
          .order('created_at', { ascending: true }),
        supabase
          .from('inventory_logs')
          .select('*')
          .gte('created_at', range.start)
          .lte('created_at', range.end)
          .order('created_at', { ascending: false }),
        supabase
          .from('inventory_logs')
          .select('*')
          .gte('created_at', recentMovementRange.start)
          .lte('created_at', recentMovementRange.end)
          .order('created_at', { ascending: true }),
      ])

      if (jobOrdersResult.error) throw jobOrdersResult.error
      if (inventoryLogsResult.error) throw inventoryLogsResult.error
      if (recentInventoryLogsResult.error) throw recentInventoryLogsResult.error

      const jobOrders = normalizeJobOrders(jobOrdersResult.data ?? [])
      const inventoryLogs = normalizeInventoryLogs(inventoryLogsResult.data ?? [])
      const recentInventoryLogs = normalizeInventoryLogs(recentInventoryLogsResult.data ?? [])
      const referenceIds = [...new Set(
        inventoryLogs
          .filter((log) => log.reference_type === 'job-order' && Boolean(log.reference_id))
          .map((log) => log.reference_id as string)
      )]
      const jobOrderCodeMap = new Map<string, string>()

      if (referenceIds.length) {
        const { data: referencedJobOrders, error: referencedJobOrdersError } = await supabase
          .from('job_orders')
          .select('id, job_order_code')
          .in('id', referenceIds)

        if (referencedJobOrdersError) throw referencedJobOrdersError

        ;((referencedJobOrders ?? []) as JobOrderReference[]).forEach((jobOrder) => {
          jobOrderCodeMap.set(jobOrder.id, jobOrder.job_order_code)
        })
      }

      return {
        range,
        summary: deriveSummary(jobOrders, inventoryLogs),
        statusBreakdown: deriveStatusBreakdown(jobOrders),
        revenueTrend: deriveRevenueTrend(jobOrders, range),
        topServices: deriveTopServices(jobOrders),
        inventoryMovementTrend: deriveInventoryMovementTrend(inventoryLogs, range),
        recentInventoryMovementTrend: deriveInventoryMovementTrend(recentInventoryLogs, recentMovementRange),
        inventoryLogs: deriveInventoryLogs(inventoryLogs, jobOrderCodeMap),
      } as ReportsAnalyticsResult
    },
  })
}

export type { ReportsAnalyticsResult, ReportsFilters, ReportsPeriod } from './types'

import { InventoryLog, JobOrderStatus } from '../../types'

export type ReportsPeriod = 'day' | 'month' | 'year' | 'custom'

export interface ReportsFilters {
  period: ReportsPeriod
  day: string
  month: string
  year: string
  startDate: string
  endDate: string
}

export interface ReportsDateRange {
  start: string
  end: string
  label: string
  bucket: 'hour' | 'day' | 'month'
}

export interface ReportsSummary {
  totalJobs: number
  completedJobs: number
  inProgressJobs: number
  cancelledJobs: number
  completionRate: number
  totalRevenue: number
  averageTicket: number
  partsRevenue: number
  oilRevenue: number
  laborRevenue: number
  discountsGiven: number
  inventoryMovements: number
  autoDeductedUnits: number
  restockedUnits: number
}

export interface ReportsTrendPoint {
  key: string
  label: string
  jobs: number
  completedJobs: number
  revenue: number
}

export interface ReportsStatusPoint {
  status: JobOrderStatus
  label: string
  count: number
}

export interface ReportsServicePoint {
  serviceName: string
  jobs: number
  revenue: number
}

export interface ReportsInventoryMovementPoint {
  key: string
  label: string
  autoDeducted: number
  restocked: number
}

export interface ReportsInventoryLogRow extends InventoryLog {
  absoluteQuantity: number
  referenceDisplay: string
}

export interface ReportsAnalyticsResult {
  range: ReportsDateRange
  summary: ReportsSummary
  statusBreakdown: ReportsStatusPoint[]
  revenueTrend: ReportsTrendPoint[]
  topServices: ReportsServicePoint[]
  inventoryMovementTrend: ReportsInventoryMovementPoint[]
  recentInventoryMovementTrend: ReportsInventoryMovementPoint[]
  inventoryLogs: ReportsInventoryLogRow[]
}

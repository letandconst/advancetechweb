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
  selling_price: number | null
  base_cost: number | null
  profit_per_unit: number | null
}

export interface ReportsInventoryProfitSummary {
  totalItems: number
  totalUnits: number
  totalRetailValue: number
  totalCostValue: number
  totalProfit: number
  overallMarginPct: number
  averageProfitPerUnit: number
  itemsWithCost: number
  itemsWithoutCost: number
}

export interface ReportsInventoryProfitItem {
  id: string
  name: string
  category: string
  amount: number
  sellingPrice: number
  baseCost: number | null
  profitPerUnit: number
  marginPct: number
  totalProfit: number
}

export interface ReportsMarginDistributionPoint {
  key: 'high_margin' | 'good_margin' | 'acceptable_margin' | 'low_margin' | 'no_profit' | 'unknown_cost'
  label: string
  count: number
}

export interface ReportsAnalyticsResult {
  range: ReportsDateRange
  summary: ReportsSummary
  statusBreakdown: ReportsStatusPoint[]
  revenueTrend: ReportsTrendPoint[]
  recentJobVolumeTrend: ReportsTrendPoint[]
  topServices: ReportsServicePoint[]
  inventoryMovementTrend: ReportsInventoryMovementPoint[]
  recentInventoryMovementTrend: ReportsInventoryMovementPoint[]
  inventoryLogs: ReportsInventoryLogRow[]
  inventoryProfitSummary: ReportsInventoryProfitSummary
  inventoryProfitItems: ReportsInventoryProfitItem[]
  topInventoryProfitItems: ReportsInventoryProfitItem[]
  marginDistribution: ReportsMarginDistributionPoint[]
}

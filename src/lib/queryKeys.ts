type GenericFilters = object

type ReportsDateRangeKey = {
  start: string
  end: string
  label: string
  bucket: 'hour' | 'day' | 'month'
}

type ReportsFiltersKey = {
  period: 'day' | 'month' | 'year' | 'custom'
  day: string
  month: string
  year: string
  startDate: string
  endDate: string
}

export const queryKeys = {
  users: ['users'] as const,
  mechanics: ['mechanics'] as const,
  services: (params?: { page: number; pageSize: number; filters: GenericFilters }) =>
    ['services', params] as const,
  inventory: (params?: { page: number; pageSize: number; filters: GenericFilters; lowStockThreshold: number }) =>
    ['inventory', params] as const,
  inventoryLogs: (params: { inventoryItemId?: string; limit: number; offset: number }) =>
    ['inventory-logs', params] as const,
  jobOrders: (params?: { page: number; pageSize: number; filters: GenericFilters }) =>
    ['job-orders', params] as const,
  jobOrder: (id?: string) => ['job-order', id] as const,
  dashboardStats: (lowStockThreshold: number) => ['dashboard-stats', lowStockThreshold] as const,
  dashboardRecentJobs: ['dashboard-recent-jobs'] as const,
  dashboardLowStock: (lowStockThreshold: number) => ['dashboard-low-stock', lowStockThreshold] as const,
  reportsAnalytics: (filters: ReportsFiltersKey, range: ReportsDateRangeKey) =>
    ['reports-analytics', filters, range] as const,
}

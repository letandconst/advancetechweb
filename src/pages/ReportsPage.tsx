import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarRange,
  Download,
  PackageSearch,
  PhilippinePeso,
  TrendingUp,
} from 'lucide-react'
import { Button, LoadingSpinner } from '../components'
import { ROUTES } from '../constants'
import {
  createDefaultReportsFilters,
  useReportsAnalytics,
  type ReportsFilters,
  type ReportsInventoryLogRow,
  type ReportsInventoryMovementPoint,
  type ReportsServicePoint,
  type ReportsStatusPoint,
  type ReportsTrendPoint,
} from '../modules/reports'
import { downloadCsv } from '../utils/csv'

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusTone(status: ReportsStatusPoint['status']) {
  if (status === 'completed') return 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
  if (status === 'in_progress') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
  if (status === 'cancelled') return 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

function buildLinePath(points: ReportsTrendPoint[], width: number, height: number) {
  if (!points.length) return ''

  const maxValue = Math.max(...points.map((point) => point.revenue), 1)

  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
      const y = height - (point.revenue / maxValue) * height
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function TrendChart({ points }: { points: ReportsTrendPoint[] }) {
  const width = 520
  const height = 220
  const path = buildLinePath(points, width, height)
  const maxValue = Math.max(...points.map((point) => point.revenue), 1)

  return (
    <div className="space-y-4">
      <div className="h-56 rounded-[24px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(14,116,144,0.14),rgba(14,116,144,0.03))] p-4 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.04))]">
        {points.length ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
            {[0, 0.25, 0.5, 0.75, 1].map((step) => {
              const y = height - step * height
              return (
                <line
                  key={step}
                  x1="0"
                  x2={width}
                  y1={y}
                  y2={y}
                  className="stroke-slate-300/70 dark:stroke-slate-700/80"
                  strokeDasharray="4 6"
                />
              )
            })}
            <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="rgba(14, 165, 233, 0.16)" />
            <path d={path} fill="none" stroke="rgb(14, 165, 233)" strokeWidth="4" strokeLinecap="round" />
            {points.map((point, index) => {
              const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
              const y = height - (point.revenue / maxValue) * height

              return <circle key={point.key} cx={x} cy={y} r="4.5" fill="rgb(14, 165, 233)" />
            })}
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No revenue data for the selected period.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {points.slice(Math.max(points.length - 4, 0)).map((point) => (
          <div key={point.key} className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{point.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPhpCurrency(point.revenue)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function JobsBarChart({ points }: { points: ReportsTrendPoint[] }) {
  const maxValue = Math.max(...points.map((point) => point.jobs), 1)

  return (
    <div className="space-y-4">
      <div className="flex h-56 items-end gap-2 overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        {points.length ? points.map((point) => (
          <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="w-full rounded-t-2xl bg-gradient-to-t from-sky-700 to-cyan-500 transition-all" style={{ height: `${Math.max((point.jobs / maxValue) * 100, point.jobs ? 10 : 0)}%` }} />
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{point.jobs}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{point.label}</p>
            </div>
          </div>
        )) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No job order activity in this period.
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Peak volume</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{Math.max(...points.map((point) => point.jobs), 0)} jobs</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{points.reduce((sum, point) => sum + point.completedJobs, 0)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Periods shown</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{points.length}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBreakdown({ items }: { items: ReportsStatusPoint[] }) {
  const maxCount = Math.max(...items.map((item) => item.count), 1)

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.status} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                {item.label}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{item.count} jobs</span>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-slate-900 dark:bg-slate-200" style={{ width: `${(item.count / maxCount) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TopServicesTable({ items }: { items: ReportsServicePoint[] }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Service</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Jobs</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
          {items.length ? items.map((item) => (
            <tr key={item.serviceName}>
              <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{item.serviceName}</td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{item.jobs}</td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPhpCurrency(item.revenue)}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No service revenue recorded for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function InventoryMovementChart({ items }: { items: ReportsInventoryMovementPoint[] }) {
  const maxValue = Math.max(...items.flatMap((item) => [item.autoDeducted, item.restocked]), 1)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Restocked
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          Auto-deducted
        </span>
      </div>
      {items.slice(Math.max(items.length - 8, 0)).map((item) => (
        <div key={item.key} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
            <span className="text-slate-500 dark:text-slate-400">{item.restocked + item.autoDeducted} units moved</span>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Restocked</span>
                <span>{item.restocked}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-rose-500" style={{ width: `${(item.restocked / maxValue) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>Auto-deducted</span>
                <span>{item.autoDeducted}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-slate-500" style={{ width: `${(item.autoDeducted / maxValue) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function InventoryLogsTable({
  items,
  onOpenJobOrder,
}: {
  items: ReportsInventoryLogRow[]
  onOpenJobOrder: (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Timestamp</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Item</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Movement</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reference</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Qty</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">After</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/30">
          {items.length ? items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDateTime(item.created_at)}</td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.inventory_item_name}</p>
                {item.notes ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.notes}</p>
                ) : null}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.movement_type === 'restock' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                  {item.movement_type === 'restock' ? 'Restock' : 'Auto deduct'}
                </span>
              </td>
              <td className="px-4 py-3">
                {item.reference_type === 'job-order' && item.reference_id ? (
                  <button
                    type="button"
                    onClick={() => onOpenJobOrder(item.reference_id as string)}
                    className="text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-800 dark:text-sky-300 dark:decoration-sky-900/60 dark:hover:text-sky-200"
                  >
                    {item.referenceDisplay}
                  </button>
                ) : (
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.referenceDisplay}</p>
                )}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">{item.quantity_changed}</td>
              <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">{item.quantity_after}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No inventory audit logs for the selected period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function ReportsPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ReportsFilters>(() => createDefaultReportsFilters())
  const { data, isLoading, isFetching, error } = useReportsAnalytics(filters)

  const reportLabel = data?.range.label ?? 'Selected period'
  const exportPrefix = useMemo(() => {
    if (filters.period === 'custom') {
      return `reports-${filters.startDate}-to-${filters.endDate}`
    }

    if (filters.period === 'day') return `reports-${filters.day}`
    if (filters.period === 'month') return `reports-${filters.month}`
    return `reports-${filters.year}`
  }, [filters])

  function updateFilters(patch: Partial<ReportsFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  function openRelatedJobOrder(jobOrderId: string) {
    navigate(ROUTES.JOB_ORDERS_EDIT.replace(':id', jobOrderId))
  }

  function exportOverviewCsv() {
    if (!data) return

    downloadCsv(`${exportPrefix}-overview.csv`, [
      {
        period: data.range.label,
        total_jobs: data.summary.totalJobs,
        completed_jobs: data.summary.completedJobs,
        in_progress_jobs: data.summary.inProgressJobs,
        cancelled_jobs: data.summary.cancelledJobs,
        completion_rate: `${data.summary.completionRate.toFixed(1)}%`,
        total_revenue: data.summary.totalRevenue,
        average_ticket: data.summary.averageTicket,
        labor_revenue: data.summary.laborRevenue,
        parts_revenue: data.summary.partsRevenue,
        oil_revenue: data.summary.oilRevenue,
        discounts_given: data.summary.discountsGiven,
        inventory_movements: data.summary.inventoryMovements,
        auto_deducted_units: data.summary.autoDeductedUnits,
        restocked_units: data.summary.restockedUnits,
      },
    ])
  }

  function exportRevenueCsv() {
    if (!data) return

    downloadCsv(`${exportPrefix}-revenue-trend.csv`, data.revenueTrend.map((point) => ({
      label: point.label,
      jobs: point.jobs,
      completed_jobs: point.completedJobs,
      revenue: point.revenue,
    })))
  }

  function exportServicesCsv() {
    if (!data) return

    downloadCsv(`${exportPrefix}-services.csv`, data.topServices.map((item) => ({
      service_name: item.serviceName,
      jobs: item.jobs,
      revenue: item.revenue,
    })))
  }

  function exportInventoryCsv() {
    if (!data) return

    downloadCsv(`${exportPrefix}-inventory-audit.csv`, data.inventoryLogs.map((item) => ({
      timestamp: item.created_at,
      inventory_item_name: item.inventory_item_name,
      movement_type: item.movement_type,
      quantity_changed: item.quantity_changed,
      quantity_before: item.quantity_before,
      quantity_after: item.quantity_after,
      reference_type: item.reference_type,
      reference_label: item.referenceDisplay,
      reference_id: item.reference_id,
      notes: item.notes,
      created_by: item.created_by,
    })))
  }

  function exportAllCsv() {
    exportOverviewCsv()
    window.setTimeout(exportRevenueCsv, 120)
    window.setTimeout(exportServicesCsv, 240)
    window.setTimeout(exportInventoryCsv, 360)
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(14,116,144,0.16),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.95))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_36%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3 text-sky-700 shadow-sm dark:bg-slate-950/60 dark:text-sky-300">
                <BarChart3 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Analytics Workspace</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Reports & Analytics</h1>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
              Track job order volume, completed income, service mix, and inventory audit movement from one reporting surface.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
              <CalendarRange className="h-4 w-4" />
              {reportLabel}
              {isFetching && <span className="text-sky-600 dark:text-sky-300">Refreshing...</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportAllCsv} disabled={!data} className="gap-2">
              <Download className="h-4 w-4" />
              Export all CSV
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[220px_minmax(0,220px)_minmax(0,220px)_minmax(0,1fr)]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Period</span>
            <select
              value={filters.period}
              onChange={(event) => updateFilters({ period: event.target.value as ReportsFilters['period'] })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="custom">Date range</option>
            </select>
          </label>

          {filters.period === 'day' && (
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Day</span>
              <input
                type="date"
                value={filters.day}
                onChange={(event) => updateFilters({ day: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              />
            </label>
          )}

          {filters.period === 'month' && (
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Month</span>
              <input
                type="month"
                value={filters.month}
                onChange={(event) => updateFilters({ month: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              />
            </label>
          )}

          {filters.period === 'year' && (
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Year</span>
              <select
                value={filters.year}
                onChange={(event) => updateFilters({ year: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              >
                {Array.from({ length: 7 }, (_, index) => String(new Date().getFullYear() - index)).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          )}

          {filters.period === 'custom' && (
            <>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Start date</span>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => updateFilters({ startDate: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">End date</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => updateFilters({ endDate: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            CSV exports available per section
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            Audit logs resolve readable job order codes
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
            Inventory movement card is fixed to the latest 3 days
          </span>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-10 dark:border-slate-800 dark:bg-slate-900/90">
          <LoadingSpinner message="Loading reports..." />
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-6 text-sm text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300">
          Failed to load reporting data. Check your Supabase tables and try again.
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total revenue</p>
                <PhilippinePeso className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{formatPhpCurrency(data.summary.totalRevenue)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Avg ticket {formatPhpCurrency(data.summary.averageTicket)}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Job throughput</p>
                <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{data.summary.totalJobs}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data.summary.completedJobs} completed · {data.summary.inProgressJobs} active</p>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Completion rate</p>
                <TrendingUp className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{data.summary.completionRate.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data.summary.cancelledJobs} cancelled jobs</p>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue mix</p>
                <BarChart3 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{formatPhpCurrency(data.summary.laborRevenue)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Labor · {formatPhpCurrency(data.summary.partsRevenue)} parts · {formatPhpCurrency(data.summary.oilRevenue)} fluids</p>
            </div>
            <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Inventory activity</p>
                <PackageSearch className="h-4 w-4 text-sky-700 dark:text-sky-300" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{data.summary.inventoryMovements}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{data.summary.restockedUnits} restocked · {data.summary.autoDeductedUnits} auto-deducted</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Income Trend"
              description="Completed job order revenue across the selected period."
              action={<Button variant="secondary" size="sm" onClick={exportRevenueCsv} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>}
            >
              <TrendChart points={data.revenueTrend} />
            </SectionCard>

            <SectionCard
              title="Job Order Volume"
              description="Overall job creation pattern within the same period."
              action={<Button variant="secondary" size="sm" onClick={exportOverviewCsv} className="gap-2"><Download className="h-4 w-4" />Export summary</Button>}
            >
              <JobsBarChart points={data.revenueTrend} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <SectionCard
              title="Job Status Mix"
              description="Current state of job orders captured in the selected slice."
              action={<Button variant="secondary" size="sm" onClick={exportOverviewCsv} className="gap-2"><Download className="h-4 w-4" />Export status</Button>}
            >
              <StatusBreakdown items={data.statusBreakdown} />
            </SectionCard>

            <SectionCard
              title="Top Services"
              description="Most valuable services based on captured work-request lines."
              action={<Button variant="secondary" size="sm" onClick={exportServicesCsv} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>}
            >
              <TopServicesTable items={data.topServices} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <SectionCard
              title="Inventory Movement"
              description="Restock activity versus job-order-driven stock deductions over the latest 3 days."
              action={<Button variant="secondary" size="sm" onClick={exportInventoryCsv} className="gap-2"><Download className="h-4 w-4" />Export logs</Button>}
            >
              <InventoryMovementChart items={data.recentInventoryMovementTrend} />
            </SectionCard>

            <SectionCard
              title="Inventory Audit Log"
              description="Filtered audit trail with readable job order references instead of raw UUIDs."
              action={<Button variant="secondary" size="sm" onClick={exportInventoryCsv} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>}
            >
              <InventoryLogsTable items={data.inventoryLogs.slice(0, 12)} onOpenJobOrder={openRelatedJobOrder} />
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  )
}


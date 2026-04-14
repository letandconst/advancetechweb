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
  type ReportsInventoryProfitItem,
  type ReportsInventoryProfitSummary,
  type ReportsServicePoint,
  type ReportsSummary,
  type ReportsTrendPoint,
} from '../modules/reports'
import { useAppSettings } from '../modules/settings'
import { downloadCsv } from '../utils/csv'

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatWholeNumber(value: number) {
  return new Intl.NumberFormat('en-PH', {
    maximumFractionDigits: 0,
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
  const fallbackPoint = points.length ? points[points.length - 1] : null
  const [activeKey, setActiveKey] = useState<string | null>(fallbackPoint?.key ?? null)
  const activePoint = points.find((point) => point.key === activeKey) ?? fallbackPoint
  const activeIndex = activePoint ? points.findIndex((point) => point.key === activePoint.key) : -1
  const activeX = activePoint
    ? points.length === 1
      ? width / 2
      : (activeIndex / Math.max(points.length - 1, 1)) * width
    : null
  const activeY = activePoint ? height - (activePoint.revenue / maxValue) * height : null

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(14,116,144,0.14),rgba(14,116,144,0.03))] p-4 dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(56,189,248,0.18),rgba(56,189,248,0.04))]">
        {points.length ? (
          <div className="space-y-4">
            <div className="relative h-56">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" onMouseLeave={() => setActiveKey(fallbackPoint?.key ?? null)}>
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
                {activeX !== null && activeY !== null ? (
                  <>
                    <line x1={activeX} x2={activeX} y1="0" y2={height} stroke="rgba(14, 165, 233, 0.35)" strokeDasharray="4 6" />
                    <circle cx={activeX} cy={activeY} r="8" fill="rgba(14, 165, 233, 0.18)" />
                  </>
                ) : null}
                <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="rgba(14, 165, 233, 0.16)" />
                <path d={path} fill="none" stroke="rgb(14, 165, 233)" strokeWidth="4" strokeLinecap="round" />
                {points.map((point, index) => {
                  const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width
                  const y = height - (point.revenue / maxValue) * height
                  const isActive = point.key === activePoint?.key

                  return (
                    <g key={point.key} onMouseEnter={() => setActiveKey(point.key)}>
                      <circle cx={x} cy={y} r={isActive ? '6.5' : '4.5'} fill="rgb(14, 165, 233)" stroke="white" strokeWidth={isActive ? '2.5' : '1.5'} />
                      <circle cx={x} cy={y} r="14" fill="transparent" />
                    </g>
                  )
                })}
              </svg>
              {activePoint && activeX !== null && activeY !== null ? (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-950/95"
                  style={{ left: `${(activeX / width) * 100}%`, top: `${Math.max((activeY / height) * 100 - 3, 10)}%` }}
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{activePoint.label}</p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">Revenue {formatPhpCurrency(activePoint.revenue)}</p>
                  <p className="text-slate-600 dark:text-slate-400">Completed {activePoint.completedJobs} jobs</p>
                </div>
              ) : null}
            </div>

            {activePoint ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Focused period</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activePoint.label}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPhpCurrency(activePoint.revenue)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed jobs</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activePoint.completedJobs}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
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
  const visualScaleMax = Math.max(maxValue, 4)

  return (
    <div className="space-y-4">
      <div className="flex h-56 items-end gap-2 overflow-hidden rounded-[24px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        {points.length ? points.map((point) => (
          <div key={point.key} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className="w-full rounded-t-2xl bg-gradient-to-t from-sky-700 to-cyan-500 transition-all" style={{ height: `${Math.max((point.jobs / visualScaleMax) * 100, point.jobs ? 22 : 0)}%` }} />
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
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Avg daily jobs</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{formatWholeNumber(points.reduce((sum, point) => sum + point.jobs, 0) / Math.max(points.length, 1))}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">7-day total</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{points.reduce((sum, point) => sum + point.jobs, 0)}</p>
        </div>
      </div>
    </div>
  )
}

function RevenueMixChart({ summary }: { summary: ReportsSummary }) {
  const segments = [
    { key: 'labor', label: 'Labor', value: summary.laborRevenue, tone: 'bg-sky-500' },
    { key: 'parts', label: 'Parts', value: summary.partsRevenue, tone: 'bg-cyan-500' },
    { key: 'fluids', label: 'Fluids', value: summary.oilRevenue, tone: 'bg-amber-500' },
  ]
  const total = Math.max(segments.reduce((sum, item) => sum + item.value, 0), 1)

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex h-5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={segment.tone}
              style={{ width: `${(segment.value / total) * 100}%` }}
              title={`${segment.label}: ${formatPhpCurrency(segment.value)}`}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {segments.map((segment) => (
            <div key={segment.key} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${segment.tone}`} />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{segment.label}</p>
              </div>
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{formatPhpCurrency(segment.value)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{((segment.value / total) * 100).toFixed(1)}% of gross revenue</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Net collected revenue</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{formatPhpCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Discounts given</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{formatPhpCurrency(summary.discountsGiven)}</p>
        </div>
      </div>
    </div>
  )
}

function InventoryProfitOverview({
  summary,
  items,
  filter,
  onFilterChange,
  salesByItem,
}: {
  summary: ReportsInventoryProfitSummary
  items: ReportsInventoryProfitItem[]
  filter: 'all' | 'best-selling' | 'slow-moving'
  onFilterChange: (value: 'all' | 'best-selling' | 'slow-moving') => void
  salesByItem: Map<string, number>
}) {
  const maxMargin = Math.max(...items.map((item) => item.marginPct), 1)
  const filterOptions: Array<{ value: 'all' | 'best-selling' | 'slow-moving'; label: string }> = [
    { value: 'all', label: 'All in stock' },
    { value: 'best-selling', label: 'Selling well' },
    { value: 'slow-moving', label: 'No movement' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Potential stock profit</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{formatPhpCurrency(summary.totalProfit)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Overall margin</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{summary.overallMarginPct.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Avg profit / unit</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{formatPhpCurrency(summary.averageProfitPerUnit)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cost coverage</p>
          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{summary.itemsWithCost}/{summary.totalItems}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{summary.itemsWithoutCost} items still missing cost</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = option.value === filter

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isActive ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300' : 'border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:text-white'}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-3 rounded-[24px] border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category} · {item.amount} in stock · {salesByItem.get(item.id) ?? 0} units moved</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.marginPct.toFixed(1)}% margin</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatPhpCurrency(item.profitPerUnit)} per unit · {formatPhpCurrency(item.totalProfit)} stock profit</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${Math.max((item.marginPct / maxMargin) * 100, item.marginPct ? 8 : 0)}%` }} />
            </div>
          </div>
        )) : (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No inventory items match this profitability view.
          </div>
        )}
      </div>
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
    <div className="max-h-[460px] overflow-auto rounded-[24px] border border-slate-200 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Timestamp</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Item</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Selling Price</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Base Cost (MSRP)</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Profit / Unit</th>
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
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.selling_price === null ? 'N/A' : formatPhpCurrency(item.selling_price)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                {item.base_cost === null ? 'N/A' : formatPhpCurrency(item.base_cost)}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.profit_per_unit === null ? 'N/A' : formatPhpCurrency(item.profit_per_unit)}
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
              <td colSpan={9} className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
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
  const { settings } = useAppSettings()
  const [filters, setFilters] = useState<ReportsFilters>(() => createDefaultReportsFilters(new Date(), settings.reportsDefaultPeriod))
  const [profitViewFilter, setProfitViewFilter] = useState<'all' | 'best-selling' | 'slow-moving'>('all')
  const { data, isLoading, isFetching, error } = useReportsAnalytics(filters)

  const profitSalesByItem = useMemo(() => {
    const salesMap = new Map<string, number>()

    data?.inventoryLogs.forEach((log) => {
      if (log.movement_type !== 'auto-deduct') return

      salesMap.set(log.inventory_item_id, (salesMap.get(log.inventory_item_id) ?? 0) + log.absoluteQuantity)
    })

    return salesMap
  }, [data?.inventoryLogs])

  const filteredProfitItems = useMemo(() => {
    if (!data) return []

    const items = data.inventoryProfitItems.filter((item) => {
      const movedUnits = profitSalesByItem.get(item.id) ?? 0

      if (profitViewFilter === 'best-selling') return movedUnits > 0
      if (profitViewFilter === 'slow-moving') return movedUnits === 0
      return true
    })

    return items
      .sort((left, right) => right.marginPct - left.marginPct || right.profitPerUnit - left.profitPerUnit)
      .slice(0, 3)
  }, [data, profitSalesByItem, profitViewFilter])

  const reportLabel = data?.range.label ?? 'Selected period'
  const exportPrefix = useMemo(() => {
    if (filters.period === 'custom') {
      return `reports-${filters.startDate}-to-${filters.endDate}`
    }

    if (filters.period === 'day') return `reports-${filters.day}`
    if (filters.period === 'month') return `reports-${filters.month}`
    return `reports-${filters.year}`
  }, [filters])

  const activeProfitFilterLabel = profitViewFilter === 'best-selling'
    ? 'Top 3 highest margins among items with movement in the selected period.'
    : profitViewFilter === 'slow-moving'
      ? 'Top 3 highest margins among items with no movement in the selected period.'
      : 'Top 3 highest-margin inventory items from the current in-stock snapshot.'

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
      selling_price: item.selling_price,
      base_cost_msrp: item.base_cost,
      profit_per_unit: item.profit_per_unit,
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

  function exportInventoryProfitCsv() {
    if (!data) return

    downloadCsv(`${exportPrefix}-inventory-profit-overview.csv`, data.inventoryProfitItems.map((item) => ({
      item_name: item.name,
      category: item.category,
      stock_on_hand: item.amount,
      selling_price: item.sellingPrice,
      base_cost_msrp: item.baseCost,
      profit_per_unit: item.profitPerUnit,
      margin_pct: item.marginPct,
      potential_stock_profit: item.totalProfit,
    })))
  }

  function exportAllCsv() {
    exportOverviewCsv()
    window.setTimeout(exportRevenueCsv, 120)
    window.setTimeout(exportServicesCsv, 240)
    window.setTimeout(exportInventoryCsv, 360)
    window.setTimeout(exportInventoryProfitCsv, 480)
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
            Current inventory profit snapshot included
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <SectionCard
              title="Income Trend"
              description="Completed job order revenue across the selected period."
              action={<Button variant="secondary" size="sm" onClick={exportRevenueCsv} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>}
            >
              <TrendChart points={data.revenueTrend} />
            </SectionCard>

            <SectionCard
              title="Revenue Composition"
              description="See how labor, parts, and fluids contribute to gross sales in the selected period."
              action={<Button variant="secondary" size="sm" onClick={exportOverviewCsv} className="gap-2"><Download className="h-4 w-4" />Export summary</Button>}
            >
              <RevenueMixChart summary={data.summary} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <SectionCard
              title="Top Services"
              description="Most valuable services based on captured work-request lines for the selected period."
              action={<Button variant="secondary" size="sm" onClick={exportServicesCsv} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>}
            >
              <TopServicesTable items={data.topServices} />
            </SectionCard>

            <SectionCard
              title="Job Order Volume"
              description="Bar chart of job creation over the last 7 days."
              action={<Button variant="secondary" size="sm" onClick={exportOverviewCsv} className="gap-2"><Download className="h-4 w-4" />Export summary</Button>}
            >
              <JobsBarChart points={data.recentJobVolumeTrend} />
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <SectionCard
              title="Inventory Profit Overview"
              description={activeProfitFilterLabel}
              action={<Button variant="secondary" size="sm" onClick={exportInventoryProfitCsv} className="gap-2"><Download className="h-4 w-4" />Export profit CSV</Button>}
            >
              <InventoryProfitOverview
                summary={data.inventoryProfitSummary}
                items={filteredProfitItems}
                filter={profitViewFilter}
                onFilterChange={setProfitViewFilter}
                salesByItem={profitSalesByItem}
              />
            </SectionCard>

            <SectionCard
              title="Inventory Movement"
              description="Restock activity versus job-order-driven stock deductions over the latest 3 days."
              action={<Button variant="secondary" size="sm" onClick={exportInventoryCsv} className="gap-2"><Download className="h-4 w-4" />Export logs</Button>}
            >
              <InventoryMovementChart items={data.recentInventoryMovementTrend} />
            </SectionCard>
          </div>

          <div className="grid gap-6">
            <SectionCard
              title="Inventory Audit Log"
              description="Filtered audit trail with readable job order references instead of raw UUIDs."
              action={<Button variant="secondary" size="sm" onClick={exportInventoryCsv} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>}
            >
              <InventoryLogsTable items={data.inventoryLogs.slice(0, 10)} onOpenJobOrder={openRelatedJobOrder} />
            </SectionCard>
          </div>
        </>
      ) : null}
    </div>
  )
}


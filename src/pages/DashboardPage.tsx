import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Car,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Wallet,
  Wrench,
  TrendingUp,
  Clock,
  Users,
} from 'lucide-react'
import { Button, LoadingSpinner } from '../components'
import { ROUTES } from '../constants'
import { useAuth } from '../hooks'
import { useDashboardStats, useRecentJobOrders, useLowStockItems } from '../hooks/useDashboard'

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function statusTone(status: string) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (status === 'in_progress') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
  if (status === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function stockTone(amount: number) {
  if (amount === 0) return 'text-red-600 dark:text-red-400'
  if (amount <= 3) return 'text-orange-600 dark:text-orange-400'
  return 'text-amber-600 dark:text-amber-400'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { isAdmin, user } = useAuth()
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats()
  const { data: recentJobs, isLoading: jobsLoading } = useRecentJobOrders()
  const { data: lowStockItems, isLoading: stockLoading } = useLowStockItems()

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const today = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  console.log ('user', user)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.15),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">
              {today}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              {greeting}{user?.first_name ? `, ${user.first_name}` : ''}!
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Here's what's happening at the shop today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin() && (
              <Button onClick={() => navigate(ROUTES.JOB_ORDERS_NEW)} className="gap-2">
                <Plus className="h-4 w-4" />
                New job order
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => refetchStats()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="mt-8 flex justify-center py-8">
            <LoadingSpinner message="Loading stats..." />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Revenue</p>
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
                {formatPhpCurrency(stats?.totalRevenue ?? 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                MTD: {formatPhpCurrency(stats?.revenueMtd ?? 0)}
              </p>
            </div>

            {/* Active Jobs */}
            <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Active Jobs</p>
                <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
                {stats?.inProgressJobs ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stats?.draftJobs ?? 0} draft · {stats?.totalJobOrders ?? 0} total
              </p>
            </div>

            {/* Completed Today */}
            <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed Today</p>
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
                {stats?.completedJobsToday ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">jobs finished today</p>
            </div>

            {/* Mechanics / Stock Alert */}
            <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mechanics</p>
                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
                {stats?.activeMechanics ?? 0}
                <span className="ml-1 text-sm font-normal text-slate-400">/ {stats?.totalMechanics ?? 0}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">active mechanics</p>
            </div>
          </div>
        )}
      </section>

      {/* Quick Actions + Alerts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Quick Actions</h2>
          <div className="space-y-2">
            {isAdmin() && (
              <button
                onClick={() => navigate(ROUTES.JOB_ORDERS_NEW)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
              >
                <ClipboardList className="h-5 w-5 flex-shrink-0 text-sky-600 dark:text-sky-400" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Create Job Order</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Start a new customer job</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            )}
            <button
              onClick={() => navigate(ROUTES.JOB_ORDERS)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
            >
              <TrendingUp className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">View Job Orders</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage all job orders</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => navigate(ROUTES.MECHANICS)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
            >
              <Wrench className="h-5 w-5 flex-shrink-0 text-violet-600 dark:text-violet-400" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Mechanics</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">View and manage mechanics</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => navigate(ROUTES.INVENTORY)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
            >
              <Package className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Inventory</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Check stock and restock items</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => navigate(ROUTES.SERVICES)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
            >
              <Car className="h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Services</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage offered services</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
            {isAdmin() && (
              <button
                onClick={() => navigate(ROUTES.SETTINGS)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
              >
                <Settings className="h-5 w-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Settings</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure system settings</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        </section>

        {/* Low Stock Alert */}
        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Stock Alerts</h2>
            </div>
            <div className="flex items-center gap-3">
              {(stats?.outOfStockCount ?? 0) > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {stats?.outOfStockCount} out of stock
                </span>
              )}
              {(stats?.lowStockCount ?? 0) > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {stats?.lowStockCount} low stock
                </span>
              )}
              <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.INVENTORY)}>
                View all
              </Button>
            </div>
          </div>

          {stockLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : (lowStockItems ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle className="mb-3 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">All items are well stocked!</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No low stock or out-of-stock items.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(lowStockItems ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${stockTone(item.amount)}`}>
                      {item.amount === 0 ? 'Out of stock' : `${item.amount} left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Job Orders */}
      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recent Job Orders</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.JOB_ORDERS)}>
            View all
          </Button>
        </div>

        {jobsLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (recentJobs ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ClipboardList className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No job orders yet</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isAdmin() ? 'Create your first job order to get started.' : 'Job orders will appear here once created.'}
            </p>
            {isAdmin() && (
              <Button className="mt-4 gap-2" size="sm" onClick={() => navigate(ROUTES.JOB_ORDERS_NEW)}>
                <Plus className="h-4 w-4" />
                Create job order
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">JO Code</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer</th>
                  <th className="hidden pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell dark:text-slate-400">Mechanic</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</th>
                  <th className="hidden pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:table-cell dark:text-slate-400">Updated</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(recentJobs ?? []).map((job) => (
                  <tr key={job.id} className="group">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{job.job_order_code}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{job.customer_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{job.vehicle_make} • {job.plate_number}</p>
                    </td>
                    <td className="hidden py-3 pr-4 md:table-cell">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{job.mechanic_name ?? 'Unassigned'}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(job.status)}`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPhpCurrency(job.total)}</span>
                    </td>
                    <td className="hidden py-3 pr-4 text-right sm:table-cell">
                      <span className="text-xs text-slate-400">{timeAgo(job.updated_at)}</span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => navigate(`/job-orders/${job.id}/edit`)}
                        className="rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

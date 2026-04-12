import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, ClipboardList, Plus, ShieldAlert, Search, UserRound, Printer } from 'lucide-react'
import { Button, DataTable, LoadingSpinner } from '../components'
import { ROUTES } from '../constants'
import { useAuth } from '../hooks'
import { JobOrder, JobOrderFilters, useDeleteJobOrder, useJobOrders, useMechanicOptions, JobOrderPrintModal } from '../modules/job-orders'

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function statusTone(status: JobOrder['status']) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (status === 'in_progress') return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
  if (status === 'cancelled') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

export function JobOrdersPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState<JobOrderFilters>({
    search: '',
    status: 'all',
    mechanicId: 'all',
  })

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [printJobOrder, setPrintJobOrder] = useState<JobOrder | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  const { data: jobOrdersResult, isLoading, isFetching, error } = useJobOrders({ page, pageSize, filters })
  const { data: mechanics } = useMechanicOptions()
  const deleteJobOrder = useDeleteJobOrder()

  const items = jobOrdersResult?.items ?? []
  const totalItems = jobOrdersResult?.totalCount ?? 0
  const inProgressCount = items.filter((item) => item.status === 'in_progress').length
  const completedCount = items.filter((item) => item.status === 'completed').length

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search?.trim() ||
      (filters.status && filters.status !== 'all') ||
      (filters.mechanicId && filters.mechanicId !== 'all')
    )
  }, [filters])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const columns = [
    {
      key: 'job_order_code',
      header: 'JO ID',
      render: (value: string) => <span className="font-semibold">{value}</span>,
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (value: string, item: JobOrder) => (
        <div className="min-w-[220px]">
          <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.vehicle_make} • {item.plate_number}</p>
        </div>
      ),
    },
    {
      key: 'mechanic_name',
      header: 'Mechanic',
      render: (value: string | null) => value || 'Unassigned',
    },
    {
      key: 'job_date',
      header: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: JobOrder['status']) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(value)}`}>{value}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (value: number) => <span className="font-semibold">{formatPhpCurrency(value)}</span>,
    },
  ]

  function handleFilterChange<K extends keyof JobOrderFilters>(key: K, value: JobOrderFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({
      search: '',
      status: 'all',
      mechanicId: 'all',
    })
  }

  function handleEdit(item: JobOrder) {
    navigate(`/job-orders/${item.id}/edit`)
  }

  function handleCreate() {
    navigate(ROUTES.JOB_ORDERS_NEW)
  }

  async function handleDelete(item: JobOrder) {
    if (!confirm(`Delete ${item.job_order_code}? This action cannot be undone.`)) return

    try {
      await deleteJobOrder.mutateAsync(item.id)
      setStatusMessage({ type: 'success', message: `${item.job_order_code} deleted successfully.` })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to delete job order' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  function handlePrint(item: JobOrder) {
    setPrintJobOrder(item)
    setIsPrintModalOpen(true)
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading job orders..." />
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-sky-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Error Loading Job Orders</h3>
          <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3 text-sky-700 shadow-sm dark:bg-slate-950/60 dark:text-sky-300">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Workshop flow</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Job orders</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Create and track customer jobs, labor, parts, and oils from one operational board.</p>
          </div>
          {isAdmin() && (
            <Button onClick={handleCreate} className="gap-2 self-start lg:self-auto">
              <Plus className="h-4 w-4" />
              Create job order
            </Button>
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Total job orders
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{totalItems}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              In progress (page)
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{inProgressCount}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Completed (page)
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{completedCount}</p>
          </div>
        </div>
      </section>

      {statusMessage && (
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${
          statusMessage.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-200'
            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          )}
          <span className="text-sm">{statusMessage.message}</span>
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-6 rounded-[22px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Search className="h-3.5 w-3.5" /> Search</label>
              <input
                value={filters.search ?? ''}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                placeholder="Search JO code, customer, plate, or make"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={filters.status ?? 'all'}
                onChange={(event) => handleFilterChange('status', event.target.value as JobOrderFilters['status'])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"><UserRound className="h-3.5 w-3.5" /> Mechanic</label>
              <select
                value={filters.mechanicId ?? 'all'}
                onChange={(event) => handleFilterChange('mechanicId', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              >
                <option value="all">All mechanics</option>
                {(mechanics ?? []).map((mechanic) => (
                  <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>Reset filters</Button>
            {isFetching && <span className="text-xs text-slate-500 dark:text-slate-400">Updating results...</span>}
          </div>
        </div>

        <DataTable
          data={items}
          columns={columns}
          onView={handleEdit}
          onEdit={isAdmin() ? handleEdit : undefined}
          onDelete={isAdmin() ? handleDelete : undefined}
          customActions={[
            {
              icon: <Printer className="h-4 w-4" />,
              label: 'Print',
              onClick: handlePrint,
              hidden: (item) => item.status !== 'completed',
            },
          ]}
          loading={isLoading && !jobOrdersResult}
          pageSize={pageSize}
          paginationMode="server"
          currentPage={page}
          totalItems={totalItems}
          onPageChange={setPage}
          emptyMessage="No job orders found for the selected filters."
        />
      </section>

      {printJobOrder && (
        <JobOrderPrintModal
          isOpen={isPrintModalOpen}
          jobOrder={printJobOrder}
          onClose={() => {
            setIsPrintModalOpen(false)
            setPrintJobOrder(null)
          }}
        />
      )}
    </div>
  )
}


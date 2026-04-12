import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Plus, ShieldAlert, Sparkles, Wrench, CircleDollarSign, FileText } from 'lucide-react'
import { Button, DataTable, LoadingSpinner, Modal } from '../components'
import { useAuth } from '../hooks'
import { ServiceForm } from '../modules/services/components/ServiceForm'
import { Service, ServiceFormData } from '../modules/services/types'
import { ServiceFilters, useCreateService, useDeactivateService, useServices, useUpdateService } from '../modules/services/hooks'

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function ServiceViewPanel({ service, onClose }: { service: Service; onClose: () => void }) {
  const fieldClass = 'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100'
  const labelClass = 'mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Service name</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{service.name}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
          service.status === 'active'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {service.status}
        </span>
      </div>

      <div>
        <p className={labelClass}><FileText className="h-3.5 w-3.5" /> Description</p>
        <p className={fieldClass}>{service.description}</p>
      </div>

      <div>
        <p className={labelClass}><CircleDollarSign className="h-3.5 w-3.5" /> Price</p>
        <p className={fieldClass}>{formatPhpCurrency(Number(service.price))}</p>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

export function ServicesPage() {
  const { isAdmin } = useAuth()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    status: 'all',
    minPrice: null,
    maxPrice: null,
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [viewingService, setViewingService] = useState<Service | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: servicesResult, isLoading, isFetching, error } = useServices({ page, pageSize, filters })
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deactivateService = useDeactivateService()

  const services = servicesResult?.items ?? []
  const totalServices = servicesResult?.totalCount ?? 0
  const activeServices = services.filter((service) => service.status === 'active').length
  const inactiveServices = totalServices - activeServices
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search?.trim() ||
      (filters.status && filters.status !== 'all') ||
      typeof filters.minPrice === 'number' ||
      typeof filters.maxPrice === 'number'
    )
  }, [filters])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const columns = [
    {
      key: 'name',
      header: 'Service',
      render: (value: string, item: Service) => (
        <div className="min-w-[220px]">
          <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (value: number) => <span className="font-medium">{formatPhpCurrency(Number(value))}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          value === 'active'
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  function handleCreate() {
    setEditingService(null)
    setIsFormOpen(true)
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setIsFormOpen(true)
  }

  function handleView(service: Service) {
    setViewingService(service)
  }

  async function handleDeactivate(service: Service) {
    if (!confirm(`Deactivate ${service.name}? This performs a soft delete by setting status to inactive.`)) return

    try {
      await deactivateService.mutateAsync(service.id)
      setStatusMessage({ type: 'success', message: `${service.name} has been set to inactive.` })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to deactivate service' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  async function handleSubmit(data: ServiceFormData) {
    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...data })
        setStatusMessage({ type: 'success', message: 'Service updated successfully' })
      } else {
        await createService.mutateAsync(data)
        setStatusMessage({ type: 'success', message: 'Service created successfully' })
      }

      setIsFormOpen(false)
      setEditingService(null)
      setTimeout(() => setStatusMessage(null), 3000)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to save service' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  function handleCancelForm() {
    setIsFormOpen(false)
    setEditingService(null)
  }

  function handleCloseView() {
    setViewingService(null)
  }

  function handleFilterChange<K extends keyof ServiceFilters>(key: K, value: ServiceFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({
      search: '',
      status: 'all',
      minPrice: null,
      maxPrice: null,
    })
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading services..." />
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Error Loading Services</h3>
          <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.2),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">Workshop catalog</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Services management</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Maintain pricing for standard specialization work and ad hoc repair services in one module.</p>
          </div>
          {isAdmin() && (
            <Button onClick={handleCreate} className="gap-2 self-start lg:self-auto">
              <Plus className="h-4 w-4" />
              Add service
            </Button>
          )}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Total services
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{totalServices}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Active on page
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{activeServices}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Inactive (filtered)
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{inactiveServices}</p>
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
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Search</label>
              <input
                value={filters.search ?? ''}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                placeholder="Search service name or description"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-950"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={filters.status ?? 'all'}
                onChange={(event) => handleFilterChange('status', event.target.value as ServiceFilters['status'])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-950"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Min price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={typeof filters.minPrice === 'number' ? filters.minPrice : ''}
                onChange={(event) => {
                  const value = event.target.value
                  handleFilterChange('minPrice', value === '' ? null : Number(value))
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-950"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Max price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={typeof filters.maxPrice === 'number' ? filters.maxPrice : ''}
                onChange={(event) => {
                  const value = event.target.value
                  handleFilterChange('maxPrice', value === '' ? null : Number(value))
                }}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-950"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={clearFilters} disabled={!hasActiveFilters}>
              Reset filters
            </Button>
            {isFetching && <span className="text-xs text-slate-500 dark:text-slate-400">Updating results...</span>}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Service directory</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Track service definitions, pricing, and current availability for booking.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {totalServices} services matched
          </div>
        </div>

        <DataTable
          data={services}
          columns={columns}
          onView={handleView}
          onEdit={isAdmin() ? handleEdit : undefined}
          onDelete={isAdmin() ? handleDeactivate : undefined}
          loading={isLoading && !servicesResult}
          pageSize={pageSize}
          paginationMode="server"
          currentPage={page}
          totalItems={totalServices}
          onPageChange={setPage}
          emptyMessage="No services found for the selected filters."
        />
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={handleCancelForm}
        moduleLabel="Services"
        title={editingService ? 'Edit service' : 'Add service'}
        description={editingService ? 'Update service details without leaving the catalog view.' : 'Create a new service definition for standard or ad hoc work.'}
      >
        <ServiceForm
          initialData={editingService || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          loading={createService.isPending || updateService.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!viewingService}
        onClose={handleCloseView}
        moduleLabel="Services"
        title={viewingService?.name ?? ''}
        description="Service profile — read only"
      >
        {viewingService && (
          <ServiceViewPanel service={viewingService} onClose={handleCloseView} />
        )}
      </Modal>
    </div>
  )
}
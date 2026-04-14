import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Plus, ShieldAlert, Sparkles, Wrench, CircleDollarSign, FileText, Upload } from 'lucide-react'
import { Button, LoadingSpinner, Modal } from '../components'
import { DataTable } from '../components/DataTable'
import { useAuth } from '../hooks'
import { supabase } from '../lib/supabase'
import { ServiceForm } from '../modules/services/components/ServiceForm'
import { Service, ServiceFormData } from '../modules/services/types'
import { ServiceFilters, useBulkCreateServices, useCreateService, useDeactivateService, useServices, useUpdateService } from '../modules/services/hooks'
import { downloadSpreadsheetTemplate, getSpreadsheetValue, normalizeSpreadsheetHeader, parseSpreadsheetFile, toNumberOrNull } from '../utils/spreadsheet'

const SERVICE_IMPORT_ALIASES = {
  name: ['Service', 'Name'],
  description: ['Description'],
  price: ['Price'],
  status: ['Status'],
} as const

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
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
  const [serviceImportPreview, setServiceImportPreview] = useState<{
    fileName: string
    rows: ServiceFormData[]
    duplicateExistingNames: string[]
  } | null>(null)
  const [skipExistingServiceDuplicates, setSkipExistingServiceDuplicates] = useState(false)

  const { data: servicesResult, isLoading, isFetching, error } = useServices({ page, pageSize, filters })
  const createService = useCreateService()
  const bulkCreateServices = useBulkCreateServices()
  const updateService = useUpdateService()
  const deactivateService = useDeactivateService()
  const serviceImportInputRef = useRef<HTMLInputElement | null>(null)

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

  async function handleBulkServiceImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const rows = await parseSpreadsheetFile(file)
      const nonEmptyRows = rows.filter((row) => Object.values(row).some((value) => value.trim() !== ''))

      if (!nonEmptyRows.length) {
        setStatusMessage({ type: 'error', message: 'No import rows found. Please check your CSV/Excel file.' })
        return
      }

      const availableColumns = new Set(Object.keys(nonEmptyRows[0]))
      const missingColumns = [
        { label: 'Service', aliases: SERVICE_IMPORT_ALIASES.name },
        { label: 'Description', aliases: SERVICE_IMPORT_ALIASES.description },
        { label: 'Price', aliases: SERVICE_IMPORT_ALIASES.price },
      ].filter(({ aliases }) => !aliases.some((alias) => availableColumns.has(normalizeSpreadsheetHeader(alias))))

      if (missingColumns.length) {
        setStatusMessage({
          type: 'error',
          message: `Missing required columns: ${missingColumns.map((column) => column.label).join(', ')}. Expected columns: Service, Description, Price, Status (optional).`,
        })
        return
      }

      const errors: string[] = []
      const payload: ServiceFormData[] = []
      const seenNames = new Set<string>()

      nonEmptyRows.forEach((row, index) => {
        const rowNumber = index + 2
        const name = getSpreadsheetValue(row, SERVICE_IMPORT_ALIASES.name).trim()
        const description = getSpreadsheetValue(row, SERVICE_IMPORT_ALIASES.description).trim()
        const priceRaw = getSpreadsheetValue(row, SERVICE_IMPORT_ALIASES.price).trim()
        const statusRaw = (getSpreadsheetValue(row, SERVICE_IMPORT_ALIASES.status).trim().toLowerCase() || 'active') as ServiceFormData['status']
        const price = toNumberOrNull(priceRaw)
        const rowErrors: string[] = []
        const normalizedName = normalizeText(name)

        if (!name) rowErrors.push(`Row ${rowNumber}: name is required.`)
        if (!description) rowErrors.push(`Row ${rowNumber}: description is required.`)
        if (price === null || price < 0) rowErrors.push(`Row ${rowNumber}: price must be a valid non-negative number.`)
        if (statusRaw !== 'active' && statusRaw !== 'inactive') {
          rowErrors.push(`Row ${rowNumber}: status must be either active or inactive.`)
        }
        if (normalizedName && seenNames.has(normalizedName)) {
          rowErrors.push(`Row ${rowNumber}: duplicate service name found in the file.`)
        }

        if (rowErrors.length) {
          errors.push(...rowErrors)
          return
        }

        seenNames.add(normalizedName)

        payload.push({
          name,
          description,
          price: price ?? 0,
          status: statusRaw,
        })
      })

      if (errors.length) {
        setStatusMessage({
          type: 'error',
          message: `Import blocked due to validation errors. ${errors.slice(0, 3).join(' ')}${errors.length > 3 ? ' ...' : ''}`,
        })
        return
      }

      const incomingNames = Array.from(new Set(payload.map((item) => item.name.trim()))).filter(Boolean)
      const existingResult = await supabase
        .from('services')
        .select('name')
        .in('name', incomingNames)

      if (existingResult.error) {
        throw existingResult.error
      }

      const existingNames = new Set((existingResult.data ?? []).map((row) => normalizeText(row.name ?? '')))
      const duplicateExisting = payload
        .map((item) => item.name)
        .filter((name) => existingNames.has(normalizeText(name)))

      setServiceImportPreview({
        fileName: file.name,
        rows: payload,
        duplicateExistingNames: Array.from(new Set(duplicateExisting)),
      })
      setSkipExistingServiceDuplicates(false)
      setStatusMessage({ type: 'success', message: `File parsed successfully. Review ${payload.length} row(s) below before importing.` })
    } catch {
      setStatusMessage({ type: 'error', message: 'Unable to parse file. Please upload a valid .csv, .xlsx, or .xls file.' })
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  async function confirmServiceImport() {
    if (!serviceImportPreview) return

    const duplicateSet = new Set(serviceImportPreview.duplicateExistingNames.map(normalizeText))
    const importableRows = skipExistingServiceDuplicates
      ? serviceImportPreview.rows.filter((row) => !duplicateSet.has(normalizeText(row.name)))
      : serviceImportPreview.rows

    if (!skipExistingServiceDuplicates && serviceImportPreview.duplicateExistingNames.length > 0) {
      setStatusMessage({ type: 'error', message: 'Import blocked. Existing duplicates detected. Enable "Skip existing duplicates" to continue.' })
      return
    }

    if (!importableRows.length) {
      setStatusMessage({ type: 'error', message: 'No rows left to import after duplicate filtering.' })
      return
    }

    await bulkCreateServices.mutateAsync(importableRows)
    setServiceImportPreview(null)
    setStatusMessage({ type: 'success', message: `Successfully imported ${importableRows.length} services.` })
    setTimeout(() => setStatusMessage(null), 4000)
  }

  async function downloadServiceTemplate() {
    await downloadSpreadsheetTemplate({
      filename: 'services-import-template.xlsx',
      sheetName: 'Services Template',
      columns: [
        { header: 'Service', example: 'Oil Change Labor', width: 28 },
        { header: 'Description', example: 'Labor for full oil and filter replacement', width: 42 },
        { header: 'Price', example: 1200, width: 14 },
        {
          header: 'Status',
          example: 'active',
          width: 16,
          dropdownOptions: ['active', 'inactive'],
          promptTitle: 'Service status',
          prompt: 'Choose active or inactive.',
        },
      ],
    })
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
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-sky-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Error Loading Services</h3>
          <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.2),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3 text-sky-700 shadow-sm dark:bg-slate-950/60 dark:text-sky-300">
                <Wrench className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Workshop catalog</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Services management</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-lg">Maintain pricing for standard specialization work and ad hoc repair services in one module.</p>
          </div>
          {isAdmin() ? (
            <div className="self-start lg:ml-auto lg:self-auto">
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Add service
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Wrench className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Total services
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{totalServices}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Active on page
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{activeServices}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
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

      {serviceImportPreview && (
        <section className="rounded-[22px] border border-slate-200 bg-white/95 p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Service import preview</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">File: {serviceImportPreview.fileName} • Parsed rows: {serviceImportPreview.rows.length}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Existing duplicates: {serviceImportPreview.duplicateExistingNames.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setServiceImportPreview(null)}>Cancel</Button>
              <Button type="button" size="sm" onClick={confirmServiceImport} disabled={bulkCreateServices.isPending}>
                Import {skipExistingServiceDuplicates
                  ? serviceImportPreview.rows.filter((row) => !new Set(serviceImportPreview.duplicateExistingNames.map(normalizeText)).has(normalizeText(row.name))).length
                  : serviceImportPreview.rows.length} rows
              </Button>
            </div>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={skipExistingServiceDuplicates}
              onChange={(event) => setSkipExistingServiceDuplicates(event.target.checked)}
            />
            Skip existing duplicates and import only new rows
          </label>

          {serviceImportPreview.duplicateExistingNames.length > 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Duplicates found: {serviceImportPreview.duplicateExistingNames.slice(0, 5).join(', ')}{serviceImportPreview.duplicateExistingNames.length > 5 ? ' ...' : ''}
            </p>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/70">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {serviceImportPreview.rows.slice(0, 20).map((row, index) => (
                  <tr key={`${row.name}-${index}`}>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{row.name}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">{row.description}</td>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{formatPhpCurrency(Number(row.price))}</td>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {serviceImportPreview.rows.length > 20 && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Showing first 20 rows only.</p>
          )}
        </section>
      )}

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-sky-200/80 bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(224,242,254,0.82))] p-4 shadow-[0_18px_44px_-34px_rgba(14,116,144,0.55)] dark:border-sky-900/50 dark:bg-[linear-gradient(135deg,rgba(8,47,73,0.72),rgba(15,23,42,0.92))] md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/80 p-2.5 text-sky-700 shadow-sm dark:bg-slate-950/60 dark:text-sky-300">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="mt-1 text-base font-semibold text-slate-950 dark:text-white">Bulk import tools</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Download the template, fill it offline, then upload your CSV or Excel file to review rows before importing.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={serviceImportInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleBulkServiceImport}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={downloadServiceTemplate}
              className="border-sky-200 bg-white/90 text-sky-800 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-slate-950/70 dark:text-sky-200 dark:hover:bg-sky-950/30"
            >
              Download Template
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => serviceImportInputRef.current?.click()}
              disabled={bulkCreateServices.isPending}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload CSV/Excel
            </Button>
          </div>
        </div>

        <div className="mb-6 rounded-[22px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Search</label>
              <input
                value={filters.search ?? ''}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                placeholder="Search service name or description"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={filters.status ?? 'all'}
                onChange={(event) => handleFilterChange('status', event.target.value as ServiceFilters['status'])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
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


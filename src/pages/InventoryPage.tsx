import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle, Package, Plus, ShieldAlert, Boxes, Search, Tag, ArrowUpCircle, Upload } from 'lucide-react'
import { Button, LoadingSpinner, Modal } from '../components'
import { DataTable } from '../components/DataTable'
import { INVENTORY_CATEGORIES, INVENTORY_UNIT_TYPES } from '../constants'
import { useAuth } from '../hooks'
import { supabase } from '../lib/supabase'
import { useAppSettings } from '../modules/settings'
import { InventoryForm } from '../modules/inventory/components/InventoryForm'
import {
  InventoryFilters,
  useAdjustInventoryStock,
  useBulkCreateInventoryItems,
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useInventory,
  useUpdateInventoryItem,
} from '../modules/inventory/hooks'
import { InventoryFormData, InventoryItem } from '../modules/inventory/types'
import { downloadSpreadsheetTemplate, getSpreadsheetValue, normalizeSpreadsheetHeader, parseSpreadsheetFile, toNumberOrNull } from '../utils/spreadsheet'

const INVENTORY_IMPORT_ALIASES = {
  name: ['Item', 'Name'],
  description: ['Description'],
  price: ['Selling Price', 'Price'],
  amount: ['Stock', 'Amount'],
  category: ['Category'],
  cost: ['Base Cost (MSRP)', 'Cost'],
  unitType: ['Unit Type', 'Unit_Type', 'unit_type'],
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

function stockToneClass(amount: number, lowStockThreshold: number) {
  if (amount === 0) {
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
  }

  if (amount <= lowStockThreshold) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }

  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
}

function stockLabel(amount: number, lowStockThreshold: number) {
  if (amount === 0) return 'Out of stock'
  if (amount <= lowStockThreshold) return 'Low stock'
  return 'In stock'
}

function InventoryViewPanel({
  item,
  lowStockThreshold,
  canManage,
  adjusting,
  onRestock,
  onClose,
}: {
  item: InventoryItem
  lowStockThreshold: number
  canManage: boolean
  adjusting: boolean
  onRestock: (quantity: number) => void
  onClose: () => void
}) {
  const [quantity, setQuantity] = useState(1)
  const fieldClass = 'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100'
  const labelClass = 'mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400'
  const unitCost = item.cost ?? item.price
  const profitPerUnit = item.price - unitCost
  const marginPct = item.price > 0 ? (profitPerUnit / item.price) * 100 : 0
  const markupPct = unitCost > 0 ? (profitPerUnit / unitCost) * 100 : 0
  const totalProfit = profitPerUnit * item.amount

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Item name</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.category}</p>
          </div>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stockToneClass(item.amount, lowStockThreshold)}`}>
            {stockLabel(item.amount, lowStockThreshold)}
          </span>
        </div>
      </div>

      <div>
        <p className={labelClass}>Description</p>
        <p className={fieldClass}>{item.description}</p>
      </div>

      <div>
        <p className={labelClass}>Selling price</p>
        <p className={fieldClass}>{formatPhpCurrency(item.price)}</p>
      </div>

      <div>
        <p className={labelClass}>Base cost (MSRP)</p>
        <p className={fieldClass}>{item.cost === undefined || item.cost === null ? 'Not set' : formatPhpCurrency(item.cost)}</p>
      </div>

      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/40">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profit metrics</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className={labelClass}>Profit per unit</p>
            <p className={fieldClass}>{formatPhpCurrency(profitPerUnit)}</p>
          </div>
          <div>
            <p className={labelClass}>Margin</p>
            <p className={fieldClass}>{marginPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className={labelClass}>Markup</p>
            <p className={fieldClass}>{markupPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className={labelClass}>Total profit (in stock)</p>
            <p className={fieldClass}>{formatPhpCurrency(totalProfit)}</p>
          </div>
        </div>
      </section>

      <div>
        <p className={labelClass}>Current quantity</p>
        <p className={fieldClass}>{item.amount} pcs</p>
      </div>

      {canManage && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Manage stock</h4>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Use this to restock newly delivered parts. Stock deductions will be handled automatically by job orders.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setQuantity(Number.isNaN(value) || value < 1 ? 1 : Math.floor(value))
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onRestock(quantity)}
              disabled={adjusting || quantity < 1}
              className="gap-2"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Restock
            </Button>
          </div>
        </section>
      )}

      <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

export function InventoryPage() {
  const { isAdmin } = useAuth()
  const { settings } = useAppSettings()

  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: 'all',
    stockState: 'all',
  })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [inventoryImportPreview, setInventoryImportPreview] = useState<{
    fileName: string
    rows: InventoryFormData[]
    duplicateExistingKeys: string[]
  } | null>(null)
  const [skipExistingInventoryDuplicates, setSkipExistingInventoryDuplicates] = useState(false)

  const { data: inventoryResult, isLoading, isFetching, error } = useInventory({ page, pageSize, filters })
  const bulkCreateItems = useBulkCreateInventoryItems()
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const deleteItem = useDeleteInventoryItem()
  const adjustStock = useAdjustInventoryStock()
  const inventoryImportInputRef = useRef<HTMLInputElement | null>(null)

  const items = inventoryResult?.items ?? []
  const totalItems = inventoryResult?.totalCount ?? 0
  const lowStockCount = items.filter((item) => item.amount > 0 && item.amount <= settings.lowStockThreshold).length
  const outOfStockCount = items.filter((item) => item.amount === 0).length

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search?.trim() ||
      (filters.category && filters.category !== 'all') ||
      (filters.stockState && filters.stockState !== 'all')
    )
  }, [filters])

  useEffect(() => {
    setPage(1)
  }, [filters])

  const columns = [
    {
      key: 'name',
      header: 'Item',
      render: (value: string, item: InventoryItem) => (
        <div className="min-w-[220px]">
          <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (value: string) => (
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {value}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Selling Price',
      render: (value: number) => <span className="font-medium">{formatPhpCurrency(Number(value))}</span>,
    },
    {
      key: 'cost',
      header: 'Base Cost (MSRP)',
      render: (value: number | null | undefined) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {value === undefined || value === null ? 'Not set' : formatPhpCurrency(Number(value))}
        </span>
      ),
    },
    {
      key: 'profit_per_unit',
      header: 'Profit / Unit',
      render: (_value: unknown, item: InventoryItem) => {
        const cost = item.cost ?? item.price
        const profit = item.price - cost
        return <span className="font-medium">{formatPhpCurrency(profit)}</span>
      },
    },
    {
      key: 'amount',
      header: 'Stock',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{value}</span>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${stockToneClass(value, settings.lowStockThreshold)}`}>
            {stockLabel(value, settings.lowStockThreshold)}
          </span>
        </div>
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  function handleCreate() {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  function handleEdit(item: InventoryItem) {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  function handleView(item: InventoryItem) {
    setViewingItem(item)
  }

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete ${item.name}? This will remove the item from inventory records.`)) return

    try {
      await deleteItem.mutateAsync(item.id)
      setStatusMessage({ type: 'success', message: `${item.name} deleted successfully.` })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to delete inventory item' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  async function handleSubmit(data: InventoryFormData) {
    try {
      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, ...data })
        setStatusMessage({ type: 'success', message: 'Inventory item updated successfully' })
      } else {
        await createItem.mutateAsync(data)
        setStatusMessage({ type: 'success', message: 'Inventory item created successfully' })
      }

      setIsFormOpen(false)
      setEditingItem(null)
      setTimeout(() => setStatusMessage(null), 3000)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to save inventory item' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  async function handleBulkInventoryImport(event: ChangeEvent<HTMLInputElement>) {
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
        { label: 'Item', aliases: INVENTORY_IMPORT_ALIASES.name },
        { label: 'Description', aliases: INVENTORY_IMPORT_ALIASES.description },
        { label: 'Selling Price', aliases: INVENTORY_IMPORT_ALIASES.price },
        { label: 'Stock', aliases: INVENTORY_IMPORT_ALIASES.amount },
        { label: 'Category', aliases: INVENTORY_IMPORT_ALIASES.category },
      ].filter(({ aliases }) => !aliases.some((alias) => availableColumns.has(normalizeSpreadsheetHeader(alias))))

      if (missingColumns.length) {
        setStatusMessage({
          type: 'error',
          message: `Missing required columns: ${missingColumns.map((column) => column.label).join(', ')}. Expected columns: Item, Description, Selling Price, Stock, Category, Base Cost (MSRP) (optional), Unit Type (optional).`,
        })
        return
      }

      const allowedCategories = new Set(INVENTORY_CATEGORIES.map((category) => category.toLowerCase()))
      const allowedUnitTypes = new Set(INVENTORY_UNIT_TYPES.map((unitType) => unitType.toLowerCase()))
      const errors: string[] = []
      const payload: InventoryFormData[] = []
      const seenItems = new Set<string>()

      nonEmptyRows.forEach((row, index) => {
        const rowNumber = index + 2
        const name = getSpreadsheetValue(row, INVENTORY_IMPORT_ALIASES.name).trim()
        const description = getSpreadsheetValue(row, INVENTORY_IMPORT_ALIASES.description).trim()
        const category = getSpreadsheetValue(row, INVENTORY_IMPORT_ALIASES.category).trim()
        const price = toNumberOrNull(getSpreadsheetValue(row, INVENTORY_IMPORT_ALIASES.price))
        const amount = toNumberOrNull(getSpreadsheetValue(row, INVENTORY_IMPORT_ALIASES.amount))
        const cost = toNumberOrNull(getSpreadsheetValue(row, INVENTORY_IMPORT_ALIASES.cost))
        const unitType = getSpreadsheetValue(row, INVENTORY_IMPORT_ALIASES.unitType).trim() || undefined

        const rowErrors: string[] = []
        const normalizedKey = `${normalizeText(name)}|${normalizeText(category)}`

        if (!name) rowErrors.push(`Row ${rowNumber}: name is required.`)
        if (!description) rowErrors.push(`Row ${rowNumber}: description is required.`)
        if (!category) rowErrors.push(`Row ${rowNumber}: category is required.`)
        if (category && !allowedCategories.has(category.toLowerCase())) {
          rowErrors.push(`Row ${rowNumber}: category must match one of the configured categories.`)
        }
        if (unitType && !allowedUnitTypes.has(unitType.toLowerCase())) {
          rowErrors.push(`Row ${rowNumber}: unit type must match one of the configured unit types.`)
        }
        if (price === null || price < 0) rowErrors.push(`Row ${rowNumber}: price must be a valid non-negative number.`)
        if (amount === null || amount < 0 || !Number.isInteger(amount)) {
          rowErrors.push(`Row ${rowNumber}: amount must be a valid non-negative whole number.`)
        }
        if (cost !== null && cost < 0) rowErrors.push(`Row ${rowNumber}: cost must be non-negative when provided.`)
        if (name && category && seenItems.has(normalizedKey)) {
          rowErrors.push(`Row ${rowNumber}: duplicate item name + category found in the file.`)
        }

        if (rowErrors.length) {
          errors.push(...rowErrors)
          return
        }

        seenItems.add(normalizedKey)

        payload.push({
          name,
          description,
          price: price ?? 0,
          amount: amount ?? 0,
          category,
          cost,
          unit_type: unitType?.toLowerCase(),
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
        .from('inventory_items')
        .select('name, category')
        .in('name', incomingNames)

      if (existingResult.error) {
        throw existingResult.error
      }

      const existingKeys = new Set(
        (existingResult.data ?? []).map((row) => `${normalizeText(row.name ?? '')}|${normalizeText(row.category ?? '')}`)
      )
      const duplicateExistingKeys = Array.from(new Set(payload
        .map((item) => `${normalizeText(item.name)}|${normalizeText(item.category)}`)
        .filter((key) => existingKeys.has(key))))

      setInventoryImportPreview({
        fileName: file.name,
        rows: payload,
        duplicateExistingKeys,
      })
      setSkipExistingInventoryDuplicates(false)
      setStatusMessage({ type: 'success', message: `File parsed successfully. Review ${payload.length} row(s) below before importing.` })
    } catch {
      setStatusMessage({ type: 'error', message: 'Unable to parse file. Please upload a valid .csv, .xlsx, or .xls file.' })
      setTimeout(() => setStatusMessage(null), 4000)
    }
  }

  async function confirmInventoryImport() {
    if (!inventoryImportPreview) return

    const duplicateSet = new Set(inventoryImportPreview.duplicateExistingKeys)
    const importableRows = skipExistingInventoryDuplicates
      ? inventoryImportPreview.rows.filter((row) => !duplicateSet.has(`${normalizeText(row.name)}|${normalizeText(row.category)}`))
      : inventoryImportPreview.rows

    if (!skipExistingInventoryDuplicates && inventoryImportPreview.duplicateExistingKeys.length > 0) {
      setStatusMessage({ type: 'error', message: 'Import blocked. Existing duplicates detected. Enable "Skip existing duplicates" to continue.' })
      return
    }

    if (!importableRows.length) {
      setStatusMessage({ type: 'error', message: 'No rows left to import after duplicate filtering.' })
      return
    }

    await bulkCreateItems.mutateAsync(importableRows)
    setInventoryImportPreview(null)
    setStatusMessage({ type: 'success', message: `Successfully imported ${importableRows.length} inventory items.` })
    setTimeout(() => setStatusMessage(null), 4000)
  }

  async function downloadInventoryTemplate() {
    await downloadSpreadsheetTemplate({
      filename: 'inventory-import-template.xlsx',
      sheetName: 'Inventory Template',
      columns: [
        { header: 'Item', example: 'Engine Oil 5W-30', width: 28 },
        { header: 'Description', example: 'Fully synthetic oil 1L bottle', width: 42 },
        { header: 'Selling Price', example: 450, width: 16 },
        { header: 'Stock', example: 30, width: 12 },
        {
          header: 'Category',
          example: INVENTORY_CATEGORIES[0] ?? 'Engine Parts',
          width: 20,
          dropdownOptions: [...INVENTORY_CATEGORIES],
          promptTitle: 'Inventory category',
          prompt: 'Choose one of the configured inventory categories.',
        },
        { header: 'Base Cost (MSRP)', example: 320, width: 18 },
        {
          header: 'Unit Type',
          example: INVENTORY_UNIT_TYPES[0],
          width: 16,
          dropdownOptions: [...INVENTORY_UNIT_TYPES],
          promptTitle: 'Inventory unit type',
          prompt: 'Choose the same unit type used in the Add item form.',
        },
      ],
    })
  }

  async function handleRestock(quantity: number) {
    if (!viewingItem || quantity < 1) return

    try {
      const updated = await adjustStock.mutateAsync({ id: viewingItem.id, delta: quantity })
      setViewingItem(updated)
      setStatusMessage({ type: 'success', message: `${updated.name} restocked. Current quantity: ${updated.amount}` })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to restock item' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  function handleCancelForm() {
    setIsFormOpen(false)
    setEditingItem(null)
  }

  function handleCloseView() {
    setViewingItem(null)
  }

  function handleFilterChange<K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() {
    setFilters({
      search: '',
      category: 'all',
      stockState: 'all',
    })
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading inventory..." />
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Error Loading Inventory</h3>
          <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.25),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3 text-sky-700 shadow-sm dark:bg-slate-950/60 dark:text-sky-300">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Parts and supplies</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Inventory management</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 ">Track parts availability, avoid stockouts, and keep your auto repair operations running smoothly.</p>
          </div>
          {isAdmin() ? (
            <div className="self-start lg:ml-auto lg:self-auto">
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Add item
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Boxes className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Total items
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{totalItems}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Low stock on page
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{lowStockCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Threshold: {settings.lowStockThreshold}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Out of stock on page
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{outOfStockCount}</p>
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

      {inventoryImportPreview && (
        <section className="rounded-[22px] border border-slate-200 bg-white/95 p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Inventory import preview</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">File: {inventoryImportPreview.fileName} • Parsed rows: {inventoryImportPreview.rows.length}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Existing duplicates: {inventoryImportPreview.duplicateExistingKeys.length}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setInventoryImportPreview(null)}>Cancel</Button>
              <Button type="button" size="sm" onClick={confirmInventoryImport} disabled={bulkCreateItems.isPending}>
                Import {skipExistingInventoryDuplicates
                  ? inventoryImportPreview.rows.filter((row) => !new Set(inventoryImportPreview.duplicateExistingKeys).has(`${normalizeText(row.name)}|${normalizeText(row.category)}`)).length
                  : inventoryImportPreview.rows.length} rows
              </Button>
            </div>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={skipExistingInventoryDuplicates}
              onChange={(event) => setSkipExistingInventoryDuplicates(event.target.checked)}
            />
            Skip existing duplicates and import only new rows
          </label>

          {inventoryImportPreview.duplicateExistingKeys.length > 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              Duplicates found: {inventoryImportPreview.duplicateExistingKeys.slice(0, 5).map((key) => {
                const [name, category] = key.split('|')
                return `${name} (${category})`
              }).join(', ')}{inventoryImportPreview.duplicateExistingKeys.length > 5 ? ' ...' : ''}
            </p>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/70">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {inventoryImportPreview.rows.slice(0, 20).map((row, index) => (
                  <tr key={`${row.name}-${row.category}-${index}`}>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{row.name}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">{row.category}</td>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{formatPhpCurrency(Number(row.price))}</td>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inventoryImportPreview.rows.length > 20 && (
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
              ref={inventoryImportInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleBulkInventoryImport}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={downloadInventoryTemplate}
              className="border-sky-200 bg-white/90 text-sky-800 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-slate-950/70 dark:text-sky-200 dark:hover:bg-sky-950/30"
            >
              Download Template
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => inventoryImportInputRef.current?.click()}
              disabled={bulkCreateItems.isPending}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload CSV/Excel
            </Button>
          </div>
        </div>

        <div className="mb-6 rounded-[22px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Search className="h-3.5 w-3.5" /> Search</label>
              <input
                value={filters.search ?? ''}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                placeholder="Search item name, description, or category"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"><Tag className="h-3.5 w-3.5" /> Category</label>
              <select
                value={filters.category ?? 'all'}
                onChange={(event) => handleFilterChange('category', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              >
                <option value="all">All categories</option>
                {INVENTORY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Stock state</label>
              <select
                value={filters.stockState ?? 'all'}
                onChange={(event) => handleFilterChange('stockState', event.target.value as InventoryFilters['stockState'])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              >
                <option value="all">All stock states</option>
                <option value="in-stock">In stock</option>
                <option value="low-stock">Low stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
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
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Inventory directory</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Monitor stock levels for parts and materials used in auto repair operations.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {totalItems} items matched
          </div>
        </div>

        <DataTable
          data={items}
          columns={columns}
          onView={handleView}
          onEdit={isAdmin() ? handleEdit : undefined}
          onDelete={isAdmin() ? handleDelete : undefined}
          loading={isLoading && !inventoryResult}
          pageSize={pageSize}
          paginationMode="server"
          currentPage={page}
          totalItems={totalItems}
          onPageChange={setPage}
          emptyMessage="No inventory items found for the selected filters."
        />
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={handleCancelForm}
        moduleLabel="Inventory"
        title={editingItem ? 'Edit inventory item' : 'Add inventory item'}
        description={editingItem ? 'Update item details and stock quantity.' : 'Create a new stock item for your shop inventory.'}
      >
        <InventoryForm
          initialData={editingItem || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          loading={createItem.isPending || updateItem.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!viewingItem}
        onClose={handleCloseView}
        moduleLabel="Inventory"
        title={viewingItem?.name ?? ''}
        description="Inventory item profile — read only"
      >
        {viewingItem && (
          <InventoryViewPanel
            item={viewingItem}
            lowStockThreshold={settings.lowStockThreshold}
            canManage={isAdmin()}
            adjusting={adjustStock.isPending}
            onRestock={handleRestock}
            onClose={handleCloseView}
          />
        )}
      </Modal>
    </div>
  )
}


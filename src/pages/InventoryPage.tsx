import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle, Package, Plus, ShieldAlert, Boxes, Search, Tag, ArrowUpCircle } from 'lucide-react'
import { Button, DataTable, LoadingSpinner, Modal } from '../components'
import { INVENTORY_CATEGORIES } from '../constants'
import { useAuth } from '../hooks'
import { useAppSettings } from '../modules/settings'
import { InventoryForm } from '../modules/inventory/components/InventoryForm'
import {
  InventoryFilters,
  useAdjustInventoryStock,
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useInventory,
  useUpdateInventoryItem,
} from '../modules/inventory/hooks'
import { InventoryFormData, InventoryItem } from '../modules/inventory/types'

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
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
        <p className={labelClass}>Price</p>
        <p className={fieldClass}>{formatPhpCurrency(item.price)}</p>
      </div>

      <div>
        <p className={labelClass}>Current amount</p>
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

  const { data: inventoryResult, isLoading, isFetching, error } = useInventory({ page, pageSize, filters })
  const createItem = useCreateInventoryItem()
  const updateItem = useUpdateInventoryItem()
  const deleteItem = useDeleteInventoryItem()
  const adjustStock = useAdjustInventoryStock()

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
      header: 'Price',
      render: (value: number) => <span className="font-medium">{formatPhpCurrency(Number(value))}</span>,
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

  async function handleRestock(quantity: number) {
    if (!viewingItem || quantity < 1) return

    try {
      const updated = await adjustStock.mutateAsync({ id: viewingItem.id, delta: quantity })
      setViewingItem(updated)
      setStatusMessage({ type: 'success', message: `${updated.name} restocked. Current amount: ${updated.amount}` })
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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
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
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Track parts availability, avoid stockouts, and keep your auto repair operations running smoothly.</p>
          </div>
          {isAdmin() && (
            <Button onClick={handleCreate} className="gap-2 self-start lg:self-auto">
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          )}
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

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
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
        description={editingItem ? 'Update item details and stock amount.' : 'Create a new stock item for your shop inventory.'}
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


import { FormEvent, useEffect, useState } from 'react'
import { INVENTORY_CATEGORIES } from '../../../constants'
import { Button } from '../../../components'
import { InventoryFormData } from '../types'

interface InventoryFormProps {
  initialData?: Partial<InventoryFormData>
  onSubmit: (data: InventoryFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function InventoryForm({ initialData, onSubmit, onCancel, loading = false }: InventoryFormProps) {
  const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    description: '',
    price: 0,
    cost: undefined,
    amount: 0,
    category: INVENTORY_CATEGORIES[0],
    unit_type: 'piece',
    ...initialData,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InventoryFormData, string>>>({})

  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      cost: undefined,
      amount: 0,
      category: INVENTORY_CATEGORIES[0],
      unit_type: 'piece',
      ...initialData,
    })
    setErrors({})
  }, [initialData])

  const inputClassName = 'w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-500 dark:focus:ring-orange-950'
  const normalBorderClassName = 'border-slate-200 dark:border-slate-800'
  const errorBorderClassName = 'border-sky-400 focus:border-sky-400 focus:ring-sky-100 dark:focus:ring-sky-950'

  function validateForm() {
    const nextErrors: Partial<Record<keyof InventoryFormData, string>> = {}

    if (!formData.name.trim()) nextErrors.name = 'Name is required'
    if (!formData.description.trim()) nextErrors.description = 'Description is required'
    if (!formData.category.trim()) nextErrors.category = 'Category is required'
    if (Number.isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      nextErrors.price = 'Price must be a valid non-negative number'
    }
    if (formData.cost !== undefined && formData.cost !== null && (Number.isNaN(Number(formData.cost)) || Number(formData.cost) < 0)) {
      nextErrors.cost = 'Cost must be a valid non-negative number'
    }
    if (!Number.isInteger(formData.amount) || formData.amount < 0) {
      nextErrors.amount = 'Quantity must be a whole number and cannot be negative'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!validateForm()) return

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      cost: formData.cost !== undefined && formData.cost !== null ? Number(formData.cost) : undefined,
      amount: Math.max(Math.floor(formData.amount), 0),
      unit_type: formData.unit_type ?? 'piece',
    })
  }

  function handleChange(field: keyof InventoryFormData, value: string | number | undefined) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Calculate profit metrics
  const effectiveCost = formData.cost ?? formData.price
  const profitPerUnit = formData.price - effectiveCost
  const profitMargin = formData.price > 0 ? (profitPerUnit / formData.price) * 100 : 0
  const markup = effectiveCost > 0 ? (profitPerUnit / effectiveCost) * 100 : 0
  const totalProfit = profitPerUnit * formData.amount

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Inventory details</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Keep your auto shop parts and consumables organized for day-to-day operations.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className={`${inputClassName} ${errors.name ? errorBorderClassName : normalBorderClassName}`}
              placeholder="e.g., Brake Pad Set"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className={`${inputClassName} ${errors.description ? errorBorderClassName : normalBorderClassName}`}
              placeholder="Part details, compatible models, and notes"
            />
            {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Selling Price *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(event) => handleChange('price', event.target.value === '' ? 0 : Number(event.target.value))}
                className={`${inputClassName} ${errors.price ? errorBorderClassName : normalBorderClassName}`}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Base Cost (MSRP)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost ?? ''}
                onChange={(event) => handleChange('cost', event.target.value === '' ? undefined : Number(event.target.value))}
                className={`${inputClassName} ${errors.cost ? errorBorderClassName : normalBorderClassName}`}
                placeholder="Supplier/landed cost (optional)"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Used to calculate profit margin</p>
              {errors.cost && <p className="mt-2 text-sm text-red-600">{errors.cost}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.amount}
                onChange={(event) => handleChange('amount', event.target.value === '' ? 0 : Number(event.target.value))}
                className={`${inputClassName} ${errors.amount ? errorBorderClassName : normalBorderClassName}`}
                placeholder="0"
              />
              {errors.amount && <p className="mt-2 text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Unit Type</label>
              <select
                value={formData.unit_type ?? 'piece'}
                onChange={(event) => handleChange('unit_type', event.target.value)}
                className={`${inputClassName} ${errors.unit_type ? errorBorderClassName : normalBorderClassName}`}
              >
                <option value="piece">Piece</option>
                <option value="liter">Liter</option>
                <option value="kg">Kilogram</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="set">Set</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Category *</label>
              <select
                value={formData.category}
                onChange={(event) => handleChange('category', event.target.value)}
                className={`${inputClassName} ${errors.category ? errorBorderClassName : normalBorderClassName}`}
              >
                {INVENTORY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
            </div>
          </div>

          {/* Profit Metrics Display */}
          {formData.cost !== undefined && formData.cost !== null && (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
              <h4 className="mb-3 font-semibold text-blue-900 dark:text-blue-100">Profit Metrics (Real-time Preview)</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Selling Price</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{currencyFormatter.format(formData.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Unit Cost</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{currencyFormatter.format(effectiveCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Profit per Unit</p>
                  <p className={`text-lg font-bold ${profitPerUnit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {currencyFormatter.format(profitPerUnit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Margin %</p>
                  <p className={`text-lg font-bold ${profitMargin >= 20 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Markup %</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{markup.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Total Profit (in stock)</p>
                  <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {currencyFormatter.format(totalProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Total Units</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{formData.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Stock Retail Value</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{currencyFormatter.format(formData.price * formData.amount)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save item'}</Button>
      </div>
    </form>
  )
}


import { FormEvent, useEffect, useState } from 'react'
import { Button } from '../../../components'
import { SERVICE_SPECIALIZATIONS } from '../../../constants'
import { ServiceFormData } from '../types'

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData>
  onSubmit: (data: ServiceFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function ServiceForm({ initialData, onSubmit, onCancel, loading = false }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: 0,
    status: 'active',
    ...initialData,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormData, string>>>({})

  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      status: 'active',
      ...initialData,
    })
    setErrors({})
  }, [initialData])

  const inputClassName = 'w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950'
  const normalBorderClassName = 'border-slate-200 dark:border-slate-800'
  const errorBorderClassName = 'border-sky-400 focus:border-sky-400 focus:ring-sky-100 dark:focus:ring-sky-950'

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof ServiceFormData, string>> = {}

    if (!formData.name.trim()) newErrors.name = 'Service name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (Number.isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a valid non-negative number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    onSubmit({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
    })
  }

  function handleChange(field: keyof ServiceFormData, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function applyTemplate(serviceName: string) {
    setFormData((prev) => ({
      ...prev,
      name: serviceName,
      description: prev.description || `${serviceName} service package`,
    }))
    if (errors.name || errors.description) {
      setErrors((prev) => ({ ...prev, name: undefined, description: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Service details</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Define standard offerings and ad hoc workshop services in one catalog.</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`${inputClassName} ${errors.name ? errorBorderClassName : normalBorderClassName}`}
              placeholder="e.g., Engine Overhaul"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`${inputClassName} ${errors.description ? errorBorderClassName : normalBorderClassName}`}
              placeholder="Describe scope, inclusions, and any limitations"
            />
            {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Price *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value === '' ? 0 : Number(e.target.value))}
                className={`${inputClassName} ${errors.price ? errorBorderClassName : normalBorderClassName}`}
                placeholder="0.00"
              />
              {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as 'active' | 'inactive')}
                className={`${inputClassName} ${normalBorderClassName}`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Specialization templates</h4>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Tap to prefill the name for common services. You can still enter any ad hoc service manually.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SERVICE_SPECIALIZATIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => applyTemplate(item)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-sky-700 dark:hover:text-sky-300"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save service'}</Button>
      </div>
    </form>
  )
}


import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Button } from '../../../components'
import { InventoryItem, Mechanic, Service } from '../../../types'
import { JobOrderDiscountType, JobOrderFormData, JobOrderInventoryItem, JobOrderStatus, JobOrderWorkItem } from '../types'
import { CustomerWithVehicles } from '../../customers'

type InventoryDraftRow = {
  id: string
  inventory_item_id: string
  quantity: number
}

type WorkRequestedRow = JobOrderWorkItem & {
  mode: 'service' | 'adhoc'
  serviceId: string
}

interface JobOrderFormProps {
  mode: 'create' | 'edit' | 'view'
  initialData: JobOrderFormData
  customers: CustomerWithVehicles[]
  mechanics: Mechanic[]
  services: Service[]
  fluidOptions: InventoryItem[]
  partOptions: InventoryItem[]
  loading?: boolean
  onSubmit: (data: JobOrderFormData) => void
  onCancel: () => void
}

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function toInventoryDraftRows(items: JobOrderInventoryItem[]) {
  return items.length
    ? items.map((item) => ({ id: item.id, inventory_item_id: item.inventory_item_id, quantity: item.quantity }))
    : [{ id: crypto.randomUUID(), inventory_item_id: '', quantity: 1 }]
}

export function JobOrderForm({
  mode,
  initialData,
  customers,
  mechanics,
  services,
  fluidOptions,
  partOptions,
  loading = false,
  onSubmit,
  onCancel,
}: JobOrderFormProps) {
  const isReadOnly = mode === 'view'
  const serviceById = useMemo(() => Object.fromEntries(services.map((service) => [service.id, service])), [services])

  const [customerName, setCustomerName] = useState(initialData.customer_name)
  const [customerAddress, setCustomerAddress] = useState(initialData.customer_address)
  const [customerId, setCustomerId] = useState(initialData.customer_id ?? '')
  const [customerVehicleId, setCustomerVehicleId] = useState(initialData.customer_vehicle_id ?? '')
  const [vehicleMake, setVehicleMake] = useState(initialData.vehicle_make)
  const [vehicleModel, setVehicleModel] = useState(initialData.vehicle_model ?? '')
  const [vehicleYear, setVehicleYear] = useState<number | ''>(initialData.vehicle_year ?? '')
  const [plateNumber, setPlateNumber] = useState(initialData.plate_number)
  const [jobOrderCode] = useState(initialData.job_order_code)
  const [jobDate, setJobDate] = useState(initialData.job_date)
  const [mechanicId, setMechanicId] = useState(initialData.mechanic_id ?? '')
  const [status, setStatus] = useState<JobOrderStatus>(initialData.status)

  const [workRequested, setWorkRequested] = useState<WorkRequestedRow[]>(() => {
    if (!initialData.work_requested.length) {
      return [{ id: crypto.randomUUID(), service_name: '', amount: 0, mode: 'service', serviceId: '' }]
    }

    return initialData.work_requested.map((row) => {
      const matchedService = services.find((service) => service.name === row.service_name)
      if (matchedService) {
        return {
          ...row,
          mode: 'service' as const,
          serviceId: matchedService.id,
        }
      }

      return {
        ...row,
        mode: 'adhoc' as const,
        serviceId: '',
      }
    })
  })

  const [oilsAndFuels, setOilsAndFuels] = useState<InventoryDraftRow[]>(toInventoryDraftRows(initialData.oil_and_fuels))
  const [parts, setParts] = useState<InventoryDraftRow[]>(toInventoryDraftRows(initialData.parts))

  const [discountType, setDiscountType] = useState<JobOrderDiscountType>(initialData.discount_type)
  const [discountValue, setDiscountValue] = useState(initialData.discount_value)
  const [errors, setErrors] = useState<string[]>([])

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customers, customerId]
  )

  const selectedVehicle = useMemo(
    () => selectedCustomer?.vehicles.find((vehicle) => vehicle.id === customerVehicleId) ?? null,
    [selectedCustomer, customerVehicleId]
  )

  useEffect(() => {
    if (!selectedCustomer) return

    setCustomerName(selectedCustomer.customer_name)
    setCustomerAddress(selectedCustomer.address)
  }, [selectedCustomer])

  useEffect(() => {
    if (!selectedVehicle) return

    setVehicleMake(selectedVehicle.car_make)
    setVehicleModel(selectedVehicle.car_model)
    setVehicleYear(selectedVehicle.year)
    setPlateNumber(selectedVehicle.plate_number)
  }, [selectedVehicle])

  const inputClassName = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-default disabled:opacity-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950 dark:disabled:bg-slate-800 dark:disabled:text-slate-100'

  const fluidById = useMemo(() => Object.fromEntries(fluidOptions.map((item) => [item.id, item])), [fluidOptions])
  const partById = useMemo(() => Object.fromEntries(partOptions.map((item) => [item.id, item])), [partOptions])

  const laborTotal = useMemo(
    () => workRequested.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [workRequested]
  )

  const oilAndFuelItems = useMemo<JobOrderInventoryItem[]>(() => {
    return oilsAndFuels
      .filter((row) => row.inventory_item_id && row.quantity > 0)
      .map((row) => {
        const selected = fluidById[row.inventory_item_id]
        return {
          id: row.id,
          inventory_item_id: row.inventory_item_id,
          item_name: selected?.name ?? 'Unknown Fluid',
          category: selected?.category ?? 'Fluids',
          quantity: Math.max(Math.floor(row.quantity), 0),
          unit_price: Number(selected?.price ?? 0),
        }
      })
  }, [fluidById, oilsAndFuels])

  const partItems = useMemo<JobOrderInventoryItem[]>(() => {
    return parts
      .filter((row) => row.inventory_item_id && row.quantity > 0)
      .map((row) => {
        const selected = partById[row.inventory_item_id]
        return {
          id: row.id,
          inventory_item_id: row.inventory_item_id,
          item_name: selected?.name ?? 'Unknown Part',
          category: selected?.category ?? 'Parts',
          quantity: Math.max(Math.floor(row.quantity), 0),
          unit_price: Number(selected?.price ?? 0),
        }
      })
  }, [partById, parts])

  const oilFuelTotal = useMemo(
    () => oilAndFuelItems.reduce((sum, row) => sum + row.quantity * row.unit_price, 0),
    [oilAndFuelItems]
  )

  const partsTotal = useMemo(
    () => partItems.reduce((sum, row) => sum + row.quantity * row.unit_price, 0),
    [partItems]
  )

  const subtotal = useMemo(() => laborTotal + oilFuelTotal + partsTotal, [laborTotal, oilFuelTotal, partsTotal])

  const discountAmount = useMemo(() => {
    if (discountType === 'none') return 0
    if (discountType === 'fixed') return Math.min(discountValue, subtotal)
    return Math.min((subtotal * discountValue) / 100, subtotal)
  }, [discountType, discountValue, subtotal])

  const total = Math.max(subtotal - discountAmount, 0)

  function addWorkRequestedRow() {
    setWorkRequested((prev) => [...prev, { id: crypto.randomUUID(), service_name: '', amount: 0, mode: 'service', serviceId: '' }])
  }

  function removeWorkRequestedRow(id: string) {
    setWorkRequested((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)))
  }

  function updateWorkRequestedRow(id: string, updates: Partial<WorkRequestedRow>) {
    setWorkRequested((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)))
  }

  function handleWorkRequestedTypeChange(id: string, nextType: 'service' | 'adhoc') {
    setWorkRequested((prev) => prev.map((row) => {
      if (row.id !== id) return row

      if (nextType === 'service') {
        return {
          ...row,
          mode: 'service',
          serviceId: '',
          service_name: '',
          amount: 0,
        }
      }

      return {
        ...row,
        mode: 'adhoc',
        serviceId: '',
      }
    }))
  }

  function handleWorkRequestedServiceChange(id: string, serviceId: string) {
    const selectedService = serviceById[serviceId]

    setWorkRequested((prev) => prev.map((row) => {
      if (row.id !== id) return row

      if (!selectedService) {
        return {
          ...row,
          serviceId: '',
          service_name: '',
          amount: 0,
        }
      }

      return {
        ...row,
        serviceId,
        service_name: selectedService.name,
        amount: Number(selectedService.price ?? 0),
      }
    }))
  }

  function addInventoryRow(type: 'fluids' | 'parts') {
    const newRow = { id: crypto.randomUUID(), inventory_item_id: '', quantity: 1 }
    if (type === 'fluids') {
      setOilsAndFuels((prev) => [...prev, newRow])
      return
    }

    setParts((prev) => [...prev, newRow])
  }

  function removeInventoryRow(type: 'fluids' | 'parts', id: string) {
    if (type === 'fluids') {
      setOilsAndFuels((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)))
      return
    }

    setParts((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)))
  }

  function updateInventoryRow(type: 'fluids' | 'parts', id: string, updates: Partial<InventoryDraftRow>) {
    if (type === 'fluids') {
      setOilsAndFuels((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)))
      return
    }

    setParts((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)))
  }

  function applyDiscountPreset(type: JobOrderDiscountType, value: number) {
    setDiscountType(type)
    setDiscountValue(value)
  }

  function validateForm() {
    const nextErrors: string[] = []

    if (!customerName.trim()) nextErrors.push('Customer name is required')
    if (!customerAddress.trim()) nextErrors.push('Customer address is required')
    if (!vehicleMake.trim()) nextErrors.push('Vehicle make is required')
    if (!plateNumber.trim()) nextErrors.push('Plate number is required')
    if (!jobDate) nextErrors.push('Date is required')
    if (!mechanicId) nextErrors.push('Mechanic selection is required')

    const hasInvalidWork = workRequested.some((row) => !row.service_name.trim() || row.amount < 0)
    if (hasInvalidWork) nextErrors.push('Each work requested row must have a service name and non-negative amount')

    const hasInvalidFluids = oilsAndFuels.some((row) => row.inventory_item_id && row.quantity < 1)
    if (hasInvalidFluids) nextErrors.push('Oil and fuel quantities must be at least 1')

    const hasInvalidParts = parts.some((row) => row.inventory_item_id && row.quantity < 1)
    if (hasInvalidParts) nextErrors.push('Part quantities must be at least 1')

    setErrors(nextErrors)
    return nextErrors.length === 0
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (isReadOnly) return

    if (!validateForm()) return

    const selectedMechanic = mechanics.find((mechanic) => mechanic.id === mechanicId)

    const payload: JobOrderFormData = {
      job_order_code: jobOrderCode,
      job_date: jobDate,
      customer_id: customerId || null,
      customer_vehicle_id: customerVehicleId || null,
      customer_name: customerName.trim(),
      customer_address: customerAddress.trim(),
      vehicle_make: vehicleMake.trim(),
      vehicle_model: vehicleModel.trim() || null,
      vehicle_year: vehicleYear === '' ? null : vehicleYear,
      plate_number: plateNumber.trim(),
      mechanic_id: mechanicId,
      mechanic_name: selectedMechanic?.name ?? null,
      status,
      work_requested: workRequested
        .filter((row) => row.service_name.trim())
        .map((row) => ({
          id: row.id,
          service_name: row.service_name.trim(),
          amount: Number(row.amount || 0),
        })),
      oil_and_fuels: oilAndFuelItems,
      parts: partItems,
      labor_total: laborTotal,
      oil_fuel_total: oilFuelTotal,
      parts_total: partsTotal,
      subtotal,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: discountAmount,
      total,
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.length > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700 dark:border-sky-900/30 dark:bg-sky-900/10 dark:text-sky-200">
          <p className="font-semibold">Please check the following:</p>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Customer details</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Select customer</label>
            <select
              className={inputClassName}
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setCustomerVehicleId('')
              }}
              disabled={isReadOnly}
            >
              <option value="">Manual entry</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.customer_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Select customer vehicle</label>
            <select
              className={inputClassName}
              value={customerVehicleId}
              onChange={(e) => setCustomerVehicleId(e.target.value)}
              disabled={isReadOnly || !selectedCustomer}
            >
              <option value="">Manual vehicle entry</option>
              {(selectedCustomer?.vehicles ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.car_make} {vehicle.car_model} • {vehicle.plate_number}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Customer name *</label>
            <input className={inputClassName} value={customerName} onChange={(e) => setCustomerName(e.target.value)} readOnly={isReadOnly} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Address *</label>
            <input className={inputClassName} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} readOnly={isReadOnly} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Car make *</label>
            <input className={inputClassName} placeholder="e.g., Toyota" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} readOnly={isReadOnly} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Car model</label>
            <input className={inputClassName} placeholder="e.g., Vios" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} readOnly={isReadOnly} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
            <input type="number" className={inputClassName} value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value === '' ? '' : Number(e.target.value))} readOnly={isReadOnly} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Plate number *</label>
            <input className={inputClassName} value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} readOnly={isReadOnly} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Job order ID</label>
            <input className={`${inputClassName} bg-slate-100 dark:bg-slate-800`} value={jobOrderCode} readOnly />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Date *</label>
            <input type="date" className={inputClassName} value={jobDate} onChange={(e) => setJobDate(e.target.value)} readOnly={isReadOnly} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Mechanic *</label>
            <select className={inputClassName} value={mechanicId} onChange={(e) => setMechanicId(e.target.value)} disabled={isReadOnly}>
              <option value="">Select mechanic</option>
              {mechanics.map((mechanic) => (
                <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <select className={inputClassName} value={status} onChange={(e) => setStatus(e.target.value as JobOrderStatus)} disabled={isReadOnly}>
              <option value="draft">Draft</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Work requested</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addWorkRequestedRow} disabled={isReadOnly}>Add row</Button>
        </div>

        <div className="mt-4 space-y-3">
          {workRequested.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[130px_minmax(0,1fr)_180px_auto]">
              <select
                className={inputClassName}
                value={row.mode}
                onChange={(e) => handleWorkRequestedTypeChange(row.id, e.target.value as 'service' | 'adhoc')}
                disabled={isReadOnly}
              >
                <option value="service">Service</option>
                <option value="adhoc">Ad hoc</option>
              </select>

              {row.mode === 'service' ? (
                <select
                  className={inputClassName}
                  value={row.serviceId}
                  onChange={(e) => handleWorkRequestedServiceChange(row.id, e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClassName}
                  placeholder="Ad hoc work description"
                  value={row.service_name}
                  onChange={(e) => updateWorkRequestedRow(row.id, { service_name: e.target.value })}
                  readOnly={isReadOnly}
                />
              )}

              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClassName}
                placeholder="Amount"
                value={row.amount}
                onChange={(e) => updateWorkRequestedRow(row.id, { amount: Number(e.target.value || 0) })}
                readOnly={isReadOnly}
              />
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={isReadOnly || workRequested.length <= 1}
                onClick={() => removeWorkRequestedRow(row.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Oil and fuels</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => addInventoryRow('fluids')} disabled={isReadOnly}>Add row</Button>
        </div>
        <div className="mt-4 space-y-3">
          {oilsAndFuels.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_140px_auto]">
              <select
                className={inputClassName}
                value={row.inventory_item_id}
                onChange={(e) => updateInventoryRow('fluids', row.id, { inventory_item_id: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="">Select fluid inventory item</option>
                {fluidOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({formatPhpCurrency(item.price)})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                className={inputClassName}
                value={row.quantity}
                onChange={(e) => updateInventoryRow('fluids', row.id, { quantity: Math.max(Number(e.target.value || 1), 1) })}
                readOnly={isReadOnly}
              />
              <Button type="button" variant="danger" size="sm" disabled={isReadOnly || oilsAndFuels.length <= 1} onClick={() => removeInventoryRow('fluids', row.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Parts</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => addInventoryRow('parts')} disabled={isReadOnly}>Add row</Button>
        </div>
        <div className="mt-4 space-y-3">
          {parts.map((row) => (
            <div key={row.id} className="grid gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_140px_auto]">
              <select
                className={inputClassName}
                value={row.inventory_item_id}
                onChange={(e) => updateInventoryRow('parts', row.id, { inventory_item_id: e.target.value })}
                disabled={isReadOnly}
              >
                <option value="">Select part inventory item</option>
                {partOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({formatPhpCurrency(item.price)})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                step="1"
                className={inputClassName}
                value={row.quantity}
                onChange={(e) => updateInventoryRow('parts', row.id, { quantity: Math.max(Number(e.target.value || 1), 1) })}
                readOnly={isReadOnly}
              />
              <Button type="button" variant="danger" size="sm" disabled={isReadOnly || parts.length <= 1} onClick={() => removeInventoryRow('parts', row.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Subtotal and discount</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">Labor total: <strong>{formatPhpCurrency(laborTotal)}</strong></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">Parts total: <strong>{formatPhpCurrency(partsTotal)}</strong></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">Oil and fuels total: <strong>{formatPhpCurrency(oilFuelTotal)}</strong></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">Subtotal: <strong>{formatPhpCurrency(subtotal)}</strong></div>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Discount options</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => applyDiscountPreset('fixed', 500)} disabled={isReadOnly}>PHP 500 off</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => applyDiscountPreset('fixed', 1000)} disabled={isReadOnly}>PHP 1000 off</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => applyDiscountPreset('percentage', 5)} disabled={isReadOnly}>5%</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => applyDiscountPreset('percentage', 10)} disabled={isReadOnly}>10%</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => applyDiscountPreset('percentage', 15)} disabled={isReadOnly}>15%</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => applyDiscountPreset('none', 0)} disabled={isReadOnly}>No discount</Button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select className={inputClassName} value={discountType} onChange={(e) => setDiscountType(e.target.value as JobOrderDiscountType)} disabled={isReadOnly}>
              <option value="none">No discount</option>
              <option value="fixed">Fixed (PHP)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClassName}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value || 0))}
              placeholder={discountType === 'percentage' ? 'e.g., 10' : 'e.g., 500'}
              readOnly={isReadOnly}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          Discount amount: <strong>{formatPhpCurrency(discountAmount)}</strong>
          <br />
          Grand total: <strong>{formatPhpCurrency(total)}</strong>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>{isReadOnly ? 'Back' : 'Cancel'}</Button>
        {!isReadOnly && <Button type="submit" disabled={loading}>{loading ? 'Saving...' : mode === 'create' ? 'Create job order' : 'Update job order'}</Button>}
      </div>
    </form>
  )
}


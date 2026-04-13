import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Car, CheckCircle, Plus, Users } from 'lucide-react'
import { Button, DataTable, LoadingSpinner, Modal } from '../components'
import { ROUTES } from '../constants'
import { useAuth } from '../hooks'
import {
  useCreateCustomer,
  useCustomerJobOrderHistory,
  useCustomers,
  useDeleteCustomer,
  useDeleteCustomerVehicle,
  useUpsertCustomerVehicle,
  useUpdateCustomer,
  useVehicleMakes,
  useVehicleModels,
  type CustomerWithVehicles,
} from '../modules/customers'

const comboboxInputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950 disabled:cursor-not-allowed disabled:opacity-50'

function ComboboxInput({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const filtered = useMemo(
    () => options.filter((opt) => opt.toLowerCase().includes(value.toLowerCase())),
    [options, value]
  )

  const showList = open && filtered.length > 0

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault()
        onSelect(filtered[activeIndex])
        setOpen(false)
        setActiveIndex(-1)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        className={comboboxInputClassName}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {showList && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={i === activeIndex}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                i === activeIndex
                  ? 'bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200'
                  : 'text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700/50'
              }`}
              onMouseDown={() => {
                onSelect(opt)
                setOpen(false)
                setActiveIndex(-1)
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CustomerVehicleForm({
  customerId,
  onSave,
  loading,
}: {
  customerId: string
  onSave: () => void
  loading: boolean
}) {
  const [makeSearch, setMakeSearch] = useState('')
  const { data: makes } = useVehicleMakes(makeSearch)
  const selectedMake = useMemo(() => (makes ?? []).find((item) => item.name === makeSearch), [makes, makeSearch])

  const [modelSearch, setModelSearch] = useState('')
  const { data: models } = useVehicleModels(selectedMake?.id ?? '', modelSearch)

  const upsertVehicle = useUpsertCustomerVehicle()

  const [year, setYear] = useState(new Date().getFullYear())
  const [plateNumber, setPlateNumber] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedMake || !modelSearch.trim() || !plateNumber.trim()) return

    await upsertVehicle.mutateAsync({
      customer_id: customerId,
      car_make: selectedMake.name,
      car_model: modelSearch.trim(),
      year,
      plate_number: plateNumber.trim().toUpperCase(),
      is_primary: false,
    })

    setMakeSearch('')
    setModelSearch('')
    setYear(new Date().getFullYear())
    setPlateNumber('')
    onSave()
  }

  const inputClassName = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950'

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 md:grid-cols-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Car make</label>
        <ComboboxInput
          value={makeSearch}
          onChange={(val) => { setMakeSearch(val); setModelSearch('') }}
          onSelect={(val) => { setMakeSearch(val); setModelSearch('') }}
          options={(makes ?? []).map((make) => make.name)}
          placeholder="Search make"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Car model</label>
        <ComboboxInput
          value={modelSearch}
          onChange={setModelSearch}
          onSelect={setModelSearch}
          options={(models ?? []).map((model) => model.name)}
          placeholder={selectedMake ? 'Search model' : 'Select make first'}
          disabled={!selectedMake}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Year</label>
        <input
          type="number"
          className={inputClassName}
          min={1980}
          max={new Date().getFullYear() + 1}
          value={year}
          onChange={(event) => setYear(Number(event.target.value) || new Date().getFullYear())}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Plate #</label>
        <input
          className={inputClassName}
          value={plateNumber}
          onChange={(event) => setPlateNumber(event.target.value)}
          placeholder="ABC 1234"
        />
      </div>

      <div className="md:col-span-4 flex justify-end">
        <Button type="submit" size="sm" disabled={loading || upsertVehicle.isPending || !selectedMake || !modelSearch.trim() || !plateNumber.trim()}>
          Add vehicle
        </Button>
      </div>
    </form>
  )
}

function CustomerViewPanel({
  customer,
  onClose,
  onVehicleAdded,
}: {
  customer: CustomerWithVehicles
  onClose: () => void
  onVehicleAdded: () => void
}) {
  const navigate = useNavigate()
  const { data: history, isLoading, error: historyError } = useCustomerJobOrderHistory(customer.id)
  const deleteVehicle = useDeleteCustomerVehicle()

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer</p>
        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{customer.customer_name}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{customer.address}</p>
        {customer.phone_number && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">📞 {customer.phone_number}</p>
        )}
      </div>

      <section>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Vehicles</h4>
        {customer.vehicles.length ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Car</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Plate</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {customer.vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{vehicle.year} {vehicle.car_make} {vehicle.car_model}</td>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{vehicle.plate_number}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await deleteVehicle.mutateAsync(vehicle.id)
                          onVehicleAdded()
                        }}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No vehicles yet.</p>
        )}

        <CustomerVehicleForm customerId={customer.id} onSave={onVehicleAdded} loading={deleteVehicle.isPending} />
      </section>

      <section>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Job order history</h4>
        {isLoading ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading history...</p>
        ) : historyError ? (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">Unable to load history. Make sure the database schema is up to date.</p>
        ) : history?.length ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900/80">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Car</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">JO #</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {history.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400">{new Date(row.job_date).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">{row.vehicle_year ?? ''} {row.vehicle_make} {row.vehicle_model ?? ''} • {row.plate_number}</td>
                    <td className="px-3 py-2 text-sm">
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.JOB_ORDERS_VIEW.replace(':id', row.id))}
                        className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-800 dark:text-sky-300"
                      >
                        {row.job_order_code}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        row.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        row.status === 'in_progress' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' :
                        row.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {row.status === 'in_progress' ? 'In progress' : row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No job order history yet.</p>
        )}
      </section>

      <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
        <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

export function CustomersPage() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [viewing, setViewing] = useState<CustomerWithVehicles | null>(null)
  const [editing, setEditing] = useState<CustomerWithVehicles | null>(null)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: customers, isLoading, error, refetch } = useCustomers(search)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const columns = [
    {
      key: 'customer_name',
      header: 'Customer',
      render: (value: string, item: CustomerWithVehicles) => (
        <div className="min-w-[220px]">
          <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.address}</p>
          {item.phone_number && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{item.phone_number}</p>
          )}
        </div>
      ),
    },
    {
      key: 'vehicle_count',
      header: 'Vehicles',
      render: (_value: unknown, item: CustomerWithVehicles) => item.vehicles.length,
    },
    {
      key: 'latest_car',
      header: 'Latest car',
      render: (_value: unknown, item: CustomerWithVehicles) => {
        const latest = item.vehicles[item.vehicles.length - 1]
        return latest ? `${latest.car_make} ${latest.car_model} (${latest.plate_number})` : 'N/A'
      },
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  function openCreate() {
    setEditing(null)
    setFormName('')
    setFormAddress('')
    setFormPhone('')
    setFormOpen(true)
  }

  function openEdit(item: CustomerWithVehicles) {
    setEditing(item)
    setFormName(item.customer_name)
    setFormAddress(item.address)
    setFormPhone(item.phone_number ?? '')
    setFormOpen(true)
  }

  async function submitCustomer(event: React.FormEvent) {
    event.preventDefault()
    if (!formName.trim() || !formAddress.trim()) return

    try {
      if (editing) {
        await updateCustomer.mutateAsync({ id: editing.id, customer_name: formName.trim(), address: formAddress.trim(), phone_number: formPhone.trim() || null })
        setStatusMessage({ type: 'success', message: 'Customer updated successfully.' })
      } else {
        await createCustomer.mutateAsync({ customer_name: formName.trim(), address: formAddress.trim(), phone_number: formPhone.trim() || null })
        setStatusMessage({ type: 'success', message: 'Customer created successfully.' })
      }
      setFormOpen(false)
      setEditing(null)
      setTimeout(() => setStatusMessage(null), 2500)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to save customer.' })
      setTimeout(() => setStatusMessage(null), 2500)
    }
  }

  async function removeCustomer(item: CustomerWithVehicles) {
    if (!confirm(`Delete ${item.customer_name}? This also deletes linked vehicles.`)) return

    try {
      await deleteCustomer.mutateAsync(item.id)
      setStatusMessage({ type: 'success', message: 'Customer deleted successfully.' })
      setTimeout(() => setStatusMessage(null), 2500)
    } catch {
      setStatusMessage({ type: 'error', message: 'Failed to delete customer.' })
      setTimeout(() => setStatusMessage(null), 2500)
    }
  }

  if (!isAdmin()) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-sky-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Access denied</h3>
          <p className="text-slate-600 dark:text-slate-400">You need admin privileges to access this module.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading customers..." />
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Error loading customers</h3>
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
                <Users className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Customer relationship</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Customers module</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Track customer profile, vehicles, and complete job order history.</p>
          </div>
          <Button onClick={openCreate} className="gap-2 self-start lg:self-auto">
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
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
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer name or address"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
          />
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {customers?.length ?? 0} customers
          </div>
        </div>

        <DataTable
          data={customers ?? []}
          columns={columns}
          onView={(item) => setViewing(item)}
          onEdit={openEdit}
          onDelete={removeCustomer}
          emptyMessage="No customers found."
        />
      </section>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        moduleLabel="Customers"
        title={editing ? 'Edit customer' : 'Add customer'}
        description="Capture customer details first, then manage one or more vehicles in View mode."
      >
        <form onSubmit={submitCustomer} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Customer name *</label>
            <input
              value={formName}
              onChange={(event) => setFormName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              placeholder="Juan Dela Cruz"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Address *</label>
            <textarea
              rows={3}
              value={formAddress}
              onChange={(event) => setFormAddress(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              placeholder="Full customer address"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone number</label>
            <input
              type="tel"
              value={formPhone}
              onChange={(event) => setFormPhone(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              placeholder="e.g. 09XX XXX XXXX"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending || !formName.trim() || !formAddress.trim()}>
              {editing ? 'Save changes' : 'Create customer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        moduleLabel="Customers"
        title={viewing?.customer_name ?? ''}
        description="Customer details, vehicles, and job order history"
      >
        {viewing && (
          <CustomerViewPanel
            customer={viewing}
            onClose={() => setViewing(null)}
            onVehicleAdded={async () => {
              await refetch()
              const refreshed = (await refetch()).data?.find((item) => item.id === viewing.id)
              if (refreshed) setViewing(refreshed)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

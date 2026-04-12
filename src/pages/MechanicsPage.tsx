import { useEffect, useState } from 'react'
import { Plus, AlertCircle, CheckCircle, ShieldAlert, Users, Wrench, Phone, MapPin, Cake, Zap, UserCheck } from 'lucide-react'
import { Button, DataTable, LoadingSpinner, Modal } from '../components'
import { useAuth } from '../hooks'
import { Mechanic, MechanicFormData } from '../modules/mechanics/types'
import { useMechanics, useCreateMechanic, useUpdateMechanic, useDeactivateMechanic } from '../modules/mechanics/hooks'
import { MechanicForm } from '../modules/mechanics/components/MechanicForm'
import { resolveMechanicAvatarUrl } from '../lib/storage'

function MechanicViewPanel({ mechanic, onClose }: { mechanic: Mechanic; onClose: () => void }) {
  const fieldClass = 'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100'
  const labelClass = 'mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400'

  return (
    <div className="space-y-6">
      {/* Status badge */}
      <div className="flex items-center gap-3">
        <MechanicAvatar path={mechanic.image ?? null} name={mechanic.name} />
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{mechanic.name}</p>
          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            mechanic.status === 'active'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${mechanic.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {mechanic.status}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className={labelClass}><Phone className="h-3.5 w-3.5" /> Phone</p>
          <p className={fieldClass}>{mechanic.phone_number}</p>
        </div>
        <div>
          <p className={labelClass}><Cake className="h-3.5 w-3.5" /> Birthday</p>
          <p className={fieldClass}>{mechanic.birthday}</p>
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}><MapPin className="h-3.5 w-3.5" /> Address</p>
          <p className={fieldClass}>{mechanic.address}</p>
        </div>
        <div className="sm:col-span-2">
          <p className={labelClass}><Zap className="h-3.5 w-3.5" /> Specialization</p>
          <p className={fieldClass}>{mechanic.specialization}</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <UserCheck className="h-3.5 w-3.5" /> Emergency contact
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className={labelClass}>Contact person</p>
            <p className={fieldClass}>{mechanic.emergency_contact_person}</p>
          </div>
          <div>
            <p className={labelClass}><Phone className="h-3.5 w-3.5" /> Contact phone</p>
            <p className={fieldClass}>{mechanic.emergency_contact_phone}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  )
}

function MechanicAvatar({ path, name }: { path: string | null; name: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    let active = true
    resolveMechanicAvatarUrl(path)
      .then((resolved) => { if (active) setUrl(resolved) })
      .catch(() => { if (active) setUrl(null) })
    return () => { active = false }
  }, [path])

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('')

  return url ? (
    <img
      src={url}
      alt={name}
      className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
      onError={() => setUrl(null)}
    />
  ) : (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
      {initials || 'M'}
    </div>
  )
}

export function MechanicsPage() {
  const { isAdmin } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null)
  const [viewingMechanic, setViewingMechanic] = useState<Mechanic | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: mechanics, isLoading, error } = useMechanics()
  const createMechanic = useCreateMechanic()
  const updateMechanic = useUpdateMechanic()
  const deactivateMechanic = useDeactivateMechanic()

  const totalMechanics = mechanics?.length ?? 0
  const activeMechanics = mechanics?.filter((mechanic) => mechanic.status === 'active').length ?? 0
  const inactiveMechanics = totalMechanics - activeMechanics

  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-sky-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            Access Denied
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  const columns = [
    {
      key: 'name',
      header: 'Mechanic',
      render: (value: string, item: Mechanic) => (
        <div className="flex items-center gap-3">
          <MechanicAvatar path={item.image ?? null} name={value} />
          <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
        </div>
      ),
    },
    {
      key: 'phone_number',
      header: 'Phone',
    },
    {
      key: 'specialization',
      header: 'Specialization',
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'active'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'emergency_contact_person',
      header: 'Emergency Contact',
    },
  ]

  function handleCreate() {
    setEditingMechanic(null)
    setIsFormOpen(true)
  }

  function handleEdit(mechanic: Mechanic) {
    setEditingMechanic(mechanic)
    setIsFormOpen(true)
  }

  function handleView(mechanic: Mechanic) {
    setViewingMechanic(mechanic)
  }

  async function handleDeactivate(mechanic: Mechanic) {
    if (!confirm(`Deactivate ${mechanic.name}? Their status will be set to inactive.`)) return

    try {
      await deactivateMechanic.mutateAsync(mechanic.id)
      setStatusMessage({ type: 'success', message: `${mechanic.name} has been set to inactive.` })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to deactivate mechanic' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  async function handleSubmit(data: MechanicFormData) {
    try {
      if (editingMechanic) {
        await updateMechanic.mutateAsync({ id: editingMechanic.id, ...data })
        setStatusMessage({ type: 'success', message: 'Mechanic updated successfully' })
      } else {
        await createMechanic.mutateAsync(data)
        setStatusMessage({ type: 'success', message: 'Mechanic created successfully' })
      }
      setIsFormOpen(false)
      setEditingMechanic(null)
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to save mechanic' })
      setTimeout(() => setStatusMessage(null), 3000)
    }
  }

  function handleCancel() {
    setIsFormOpen(false)
    setEditingMechanic(null)
  }

  function handleCloseView() {
    setViewingMechanic(null)
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading mechanics..." />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-sky-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            Error Loading Mechanics
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {error.message}
          </p>
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
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Workshop team</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Mechanics management</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">Keep your mechanic roster current without losing context. Add and edit staff from a modal while the team table stays in view.</p>
          </div>
          <Button onClick={handleCreate} className="gap-2 self-start lg:self-auto">
            <Plus className="h-4 w-4" />
            Add mechanic
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Users className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Total mechanics
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{totalMechanics}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Active now
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{activeMechanics}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Inactive
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{inactiveMechanics}</p>
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
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Team directory</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review contact details, specialties, and current availability for every mechanic.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {totalMechanics} team members listed
          </div>
        </div>

        <DataTable
          data={mechanics || []}
          columns={columns}
          onView={handleView}
          onEdit={isAdmin() ? handleEdit : undefined}
          onDelete={isAdmin() ? handleDeactivate : undefined}
          loading={isLoading}
          emptyMessage="No mechanics found. Add your first mechanic to get started."
        />
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={handleCancel}
        moduleLabel="Mechanics"
        title={editingMechanic ? 'Edit mechanic' : 'Add mechanic'}
        description={editingMechanic ? 'Update mechanic details without leaving the roster view.' : 'Create a new mechanic record using a focused modal workflow.'}
      >
        <MechanicForm
          initialData={editingMechanic || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createMechanic.isPending || updateMechanic.isPending}
        />
      </Modal>

      <Modal
        isOpen={!!viewingMechanic}
        onClose={handleCloseView}
        moduleLabel="Mechanics"
        title={viewingMechanic?.name ?? ''}
        description="Mechanic profile — read only"
      >
        {viewingMechanic && (
          <MechanicViewPanel mechanic={viewingMechanic} onClose={handleCloseView} />
        )}
      </Modal>
    </div>
  )
}


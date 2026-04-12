import { Button } from './index'

interface RoleBasedDataPanelProps {
  role: string | null
  isLoading: boolean
}

const sampleItems = [
  { id: '1', label: 'Invoice #2431' },
  { id: '2', label: 'Customer request log' },
  { id: '3', label: 'Service history record' }
]

export function RoleBasedDataPanel({ role, isLoading }: RoleBasedDataPanelProps) {
  const canManage = role === 'admin'
  const statusMessage = canManage
    ? 'Admins can create, edit, and delete records.'
    : 'Viewing only: create/edit/delete actions are disabled for your role.'

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data access</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{statusMessage}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={!canManage || isLoading}>
            Create
          </Button>
          <Button type="button" disabled={!canManage || isLoading}>
            Edit
          </Button>
          <Button type="button" disabled={!canManage || isLoading}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Data records
        </h4>
        <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
          {sampleItems.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

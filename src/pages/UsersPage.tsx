import { useState } from 'react'
import { AlertCircle, CheckCircle, Plus, ShieldCheck, UserCog, Users } from 'lucide-react'
import { Button, DataTable, LoadingSpinner, Modal } from '../components'
import { useAuth } from '../hooks'
import { AppUser, UserForm, UserFormData, useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '../modules/users'

export function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth()
  const { data: users, isLoading, error } = useUsers()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  if (!isAdmin()) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-sky-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Access Denied</h3>
          <p className="text-slate-600 dark:text-slate-400">You need admin privileges to access user management.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading users..." />
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Error Loading Users</h3>
          <p className="text-slate-600 dark:text-slate-400">{error.message}</p>
        </div>
      </div>
    )
  }

  const allUsers = users ?? []
  const adminCount = allUsers.filter((item) => item.role === 'admin').length
  const memberCount = allUsers.length - adminCount

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (_: unknown, item: AppUser) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{item.first_name} {item.last_name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">@{item.username}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'role',
      header: 'Role',
      render: (value: string) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
          value === 'admin'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
            : 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300'
        }`}>
          {value}
        </span>
      ),
    },
  ]

  function handleCreate() {
    setEditingUser(null)
    setIsFormOpen(true)
  }

  function handleEdit(target: AppUser) {
    if (target.role === 'admin') {
      setStatusMessage({ type: 'error', message: 'Admin accounts are protected from peer admin edits.' })
      setTimeout(() => setStatusMessage(null), 3500)
      return
    }

    if (target.id === currentUser?.id) {
      setStatusMessage({ type: 'error', message: 'Use Profile page to edit your own account details.' })
      setTimeout(() => setStatusMessage(null), 3500)
      return
    }

    setEditingUser(target)
    setIsFormOpen(true)
  }

  async function handleDelete(target: AppUser) {
    if (target.role === 'admin') {
      setStatusMessage({ type: 'error', message: 'Admin accounts are protected from peer admin deletion.' })
      setTimeout(() => setStatusMessage(null), 3500)
      return
    }

    if (target.id === currentUser?.id) {
      setStatusMessage({ type: 'error', message: 'You cannot delete your own account while signed in.' })
      setTimeout(() => setStatusMessage(null), 3500)
      return
    }

    if (!confirm(`Delete user ${target.first_name} ${target.last_name}? This removes their access.`)) return

    try {
      await deleteUser.mutateAsync(target.id)
      setStatusMessage({ type: 'success', message: 'User deleted successfully.' })
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (mutationError) {
      setStatusMessage({
        type: 'error',
        message: mutationError instanceof Error ? mutationError.message : 'Failed to delete user.',
      })
      setTimeout(() => setStatusMessage(null), 3500)
    }
  }

  async function handleSubmit(form: UserFormData) {
    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, ...form })
        setStatusMessage({ type: 'success', message: 'User updated successfully.' })
      } else {
        if (!form.password) {
          throw new Error('Password is required when creating a user.')
        }

        await createUser.mutateAsync({ ...form, password: form.password })
        setStatusMessage({ type: 'success', message: 'User created successfully.' })
      }

      setIsFormOpen(false)
      setEditingUser(null)
      setTimeout(() => setStatusMessage(null), 3000)
    } catch (mutationError) {
      setStatusMessage({
        type: 'error',
        message: mutationError instanceof Error ? mutationError.message : 'Failed to save user.',
      })
      setTimeout(() => setStatusMessage(null), 3500)
    }
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingUser(null)
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.12),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3 text-sky-700 shadow-sm dark:bg-slate-950/60 dark:text-sky-300">
                <UserCog className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Access control</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Users management</h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Create, edit, and remove application users. Assign each account as an admin or user role.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 self-start lg:self-auto">
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Users className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Total users
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{allUsers.length}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Administrators
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{adminCount}</p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/55">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Users className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              Standard users
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{memberCount}</p>
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
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Directory</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Manage all accounts that can access the system.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {allUsers.length} account{allUsers.length === 1 ? '' : 's'}
          </div>
        </div>

        <DataTable
          data={allUsers}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canEdit={(item: AppUser) => item.role !== 'admin' && item.id !== currentUser?.id}
          canDelete={(item: AppUser) => item.role !== 'admin' && item.id !== currentUser?.id}
          emptyMessage="No users found."
        />
      </section>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        moduleLabel="Users"
        title={editingUser ? 'Edit user' : 'Add user'}
        description={editingUser ? 'Update account details and role.' : 'Create a new account and set their access role.'}
      >
        <UserForm
          initialData={editingUser ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          loading={createUser.isPending || updateUser.isPending}
        />
      </Modal>
    </div>
  )
}

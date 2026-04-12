import { FormEvent, useMemo, useState } from 'react'
import { Button } from '../../../components'
import { AppUser, UserFormData } from '../types'

interface UserFormProps {
  initialData?: AppUser
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormErrors {
  email?: string
  username?: string
  first_name?: string
  last_name?: string
  password?: string
  role?: string
}

export function UserForm({ initialData, onSubmit, onCancel, loading = false }: UserFormProps) {
  const isEdit = Boolean(initialData)
  const [formData, setFormData] = useState<UserFormData>({
    email: initialData?.email ?? '',
    username: initialData?.username ?? '',
    first_name: initialData?.first_name ?? '',
    last_name: initialData?.last_name ?? '',
    role: initialData?.role ?? 'user',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const fieldClass = useMemo(
    () =>
      'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950',
    []
  )

  function validate() {
    const nextErrors: FormErrors = {}

    if (!formData.first_name.trim()) nextErrors.first_name = 'First name is required'
    if (!formData.last_name.trim()) nextErrors.last_name = 'Last name is required'
    if (!formData.username.trim()) nextErrors.username = 'Username is required'
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Email is invalid'
    }

    if (!isEdit) {
      if (!formData.password) {
        nextErrors.password = 'Password is required'
      } else if (formData.password.length < 6) {
        nextErrors.password = 'Password must be at least 6 characters'
      }
    }

    if (!formData.role || !['admin', 'user'].includes(formData.role)) {
      nextErrors.role = 'Select a valid role'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    await onSubmit(formData)
  }

  function updateField<K extends keyof UserFormData>(key: K, value: UserFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">First name</span>
          <input
            type="text"
            value={formData.first_name}
            onChange={(event) => updateField('first_name', event.target.value)}
            className={fieldClass}
          />
          {errors.first_name && <p className="mt-1 text-sm text-red-500">{errors.first_name}</p>}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Last name</span>
          <input
            type="text"
            value={formData.last_name}
            onChange={(event) => updateField('last_name', event.target.value)}
            className={fieldClass}
          />
          {errors.last_name && <p className="mt-1 text-sm text-red-500">{errors.last_name}</p>}
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</span>
        <input
          type="text"
          value={formData.username}
          onChange={(event) => updateField('username', event.target.value)}
          className={fieldClass}
        />
        {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
        <input
          type="email"
          value={formData.email}
          onChange={(event) => updateField('email', event.target.value)}
          className={fieldClass}
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </label>

      {!isEdit && (
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Temporary password</span>
          <input
            type="password"
            value={formData.password ?? ''}
            onChange={(event) => updateField('password', event.target.value)}
            className={fieldClass}
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
        <select
          value={formData.role}
          onChange={(event) => updateField('role', event.target.value as UserFormData['role'])}
          className={fieldClass}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
      </label>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : isEdit ? 'Update user' : 'Create user'}
        </Button>
      </div>
    </form>
  )
}

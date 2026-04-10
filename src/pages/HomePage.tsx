import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Button } from '../components/Button'
import { RoleBasedDataPanel } from '../components/RoleBasedDataPanel'
import { AvatarBadge } from '../components/AvatarBadge'

export function HomePage() {
  const { user, isLoading, logout, getRole, isAdmin } = useAuth()
  const role = getRole()
  const admin = isAdmin()

  if (!user && !isLoading) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <AvatarBadge
              avatarUrl={user?.avatar_url}
              fullName={user?.full_name}
              firstName={user?.first_name}
              lastName={user?.last_name}
              username={user?.username}
            />
            <div>
              <h3 className="text-xl font-semibold">Welcome back, {user?.full_name ?? user?.username ?? user?.email}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Your role is <span className="font-semibold">{role ?? 'not assigned'}</span>.
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {admin
                  ? 'You can create, edit, and delete data in the UI.'
                  : 'You can view data, but create/edit/delete actions are disabled for your role.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <RoleBasedDataPanel role={role} isLoading={isLoading} />
    </div>
  )
}

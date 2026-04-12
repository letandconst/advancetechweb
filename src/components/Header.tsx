import { useNavigate } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useDarkMode, useAuth } from '../hooks'
import { AvatarBadge } from './AvatarBadge'
import { Dropdown, DropdownItem } from './Dropdown'

export function Header() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useDarkMode()
  const { user, logout } = useAuth()


  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Auto Repair Shop MVP</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {user && (
          <Dropdown
            trigger={
              <AvatarBadge
                avatarUrl={user.avatar_url}
                fullName={user.full_name}
                firstName={user.first_name}
                lastName={user.last_name}
                username={user.username}
                size={40}
              />
            }
          >
            <DropdownItem onClick={() => navigate('/profile')}>Profile</DropdownItem>
            <DropdownItem onClick={logout}>Logout</DropdownItem>
          </Dropdown>
        )}
      </div>
    </header>
  )
}

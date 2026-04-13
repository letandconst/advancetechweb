import { useNavigate } from 'react-router-dom'
import { Moon, Sun, User, LogOut } from 'lucide-react'
import { useDarkMode, useAuth } from '../hooks'
import { AvatarBadge } from './AvatarBadge'
import { Dropdown, DropdownItem } from './Dropdown'

export function Header() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useDarkMode()
  const { user, logout } = useAuth()

  const displayName = user
    ? user.full_name ||
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.username ||
      'User'
    : ''
  const subtext = user?.email || (user?.username ? `@${user.username}` : '')

  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Dashboard
        </p>
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
            <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-3 pb-3 pt-1 dark:border-slate-800">
              <AvatarBadge
                avatarUrl={user.avatar_url}
                fullName={user.full_name}
                firstName={user.first_name}
                lastName={user.last_name}
                username={user.username}
                size={38}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {displayName}
                </p>
                {subtext && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtext}</p>
                )}
              </div>
            </div>
            <DropdownItem onClick={() => navigate('/profile')} icon={<User className="h-4 w-4" />}>
              Profile
            </DropdownItem>
            <DropdownItem onClick={logout} icon={<LogOut className="h-4 w-4" />}>
              Log out
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </header>
  )
}

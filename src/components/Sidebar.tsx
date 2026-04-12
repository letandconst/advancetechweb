import { LayoutDashboard, Settings, ChevronLeft, ChevronRight, Users, BarChart3, Package, Wrench, ClipboardList, UserCog } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../store'
import { useAuth } from '../hooks'
import { ROUTES } from '../constants'
import { cn } from '../utils/classNames'

export function Sidebar() {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const navigation = [
    { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
    { label: 'Job Orders', icon: ClipboardList, path: ROUTES.JOB_ORDERS },
    { label: 'Mechanics', icon: Users, path: ROUTES.MECHANICS },
    ...(isAdmin() ? [{ label: 'Users', icon: UserCog, path: ROUTES.USERS }] : []),
    { label: 'Services', icon: Wrench, path: ROUTES.SERVICES },
    { label: 'Inventory', icon: Package, path: ROUTES.INVENTORY },
    { label: 'Reports', icon: BarChart3, path: ROUTES.REPORTS },
    { label: 'Settings', icon: Settings, path: ROUTES.SETTINGS },
  ]

  return (
    <div className="relative h-screen flex-shrink-0">
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-4 top-6 z-10 rounded-full border border-sky-200 bg-white p-1 shadow-sm transition hover:bg-sky-50 dark:border-sky-900/60 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      <aside
        className={cn(
          'h-screen overflow-y-auto overflow-x-hidden border-r border-slate-200 bg-white p-4 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex min-h-full flex-col justify-between">
          <div>
            <div className="mb-8 flex items-center">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-600 to-slate-900 text-lg font-semibold text-white">
                A
              </div>
              <div
                className={cn(
                  'overflow-hidden whitespace-nowrap transition-all duration-300',
                  isSidebarOpen ? 'ml-3 max-w-xs opacity-100' : 'ml-0 max-w-0 opacity-0'
                )}
              >
                <span className="text-lg font-semibold">Advanced Tech</span>
              </div>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => navigate(item.path)}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={cn(
                      'flex w-full items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
                      !isSidebarOpen && 'justify-center',
                      isActive
                        ? 'bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-900/40 dark:text-sky-200'
                        : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-950/20 dark:hover:text-sky-300'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span
                      className={cn(
                        'overflow-hidden whitespace-nowrap transition-all duration-300',
                        isSidebarOpen ? 'ml-3 max-w-[160px] opacity-100' : 'ml-0 max-w-0 opacity-0'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </aside>
    </div>
  )
}



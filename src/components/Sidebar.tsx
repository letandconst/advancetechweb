import { Home, LayoutDashboard, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '../store'
import { cn } from '../utils/classNames'

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Settings', icon: Settings },
  { label: 'Home', icon: Home }
]

export function Sidebar() {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)

  return (
    <div className="relative min-h-screen">
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-4 top-6 z-10 rounded-full border border-slate-200 bg-white p-1 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      <aside
        className={cn(
          'min-h-screen border-r border-slate-200 bg-white p-4 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white grid place-items-center text-lg font-semibold">
                A
              </div>
              {isSidebarOpen && <span className="text-lg font-semibold">Advanced Tech</span>}
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Icon className="h-5 w-5" />
                    {isSidebarOpen && item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="mt-8 text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
            MVP scaffold
          </div>
        </div>
      </aside>
    </div>
  )
}

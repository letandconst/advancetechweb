import { Settings } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/80 p-3 text-slate-700 shadow-sm dark:bg-slate-950/60 dark:text-slate-300">
            <Settings className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-600 dark:text-slate-300">System preferences</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Settings</h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Configure application settings and preferences.
        </p>
      </section>

      <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <p className="text-slate-600 dark:text-slate-400">
          Application settings interface will be implemented here.
        </p>
      </div>
    </div>
  )
}
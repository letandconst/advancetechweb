import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Settings, SlidersHorizontal } from 'lucide-react'
import { Button } from '../components'
import { useAuth } from '../hooks'
import { AppSettings, useAppSettings } from '../modules/settings'

export function SettingsPage() {
  const { isAdmin } = useAuth()
  const { settings, updateSettings, resetSettings, defaults } = useAppSettings()
  const [formState, setFormState] = useState<AppSettings>(settings)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    setFormState(settings)
  }, [settings])

  if (!isAdmin()) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-sky-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Access Denied</h3>
          <p className="text-slate-600 dark:text-slate-400">Only admins can access module settings.</p>
        </div>
      </div>
    )
  }

  const isDirty = JSON.stringify(formState) !== JSON.stringify(settings)

  function applySettings() {
    updateSettings({
      workshopName: formState.workshopName,
      workshopContact: formState.workshopContact,
      lowStockThreshold: Math.max(1, Number(formState.lowStockThreshold) || defaults.lowStockThreshold),
      reportsDefaultPeriod: formState.reportsDefaultPeriod,
    })
    setStatusMessage('Settings saved successfully.')
    window.setTimeout(() => setStatusMessage(null), 2500)
  }

  function restoreDefaults() {
    resetSettings()
    setStatusMessage('Defaults restored.')
    window.setTimeout(() => setStatusMessage(null), 2500)
  }

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
          Keep this page: it centralizes operational defaults so admins can tune behavior without code changes.
        </p>
      </section>

      {statusMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-200">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{statusMessage}</span>
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <SlidersHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Operational defaults</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Workshop name</span>
            <input
              type="text"
              value={formState.workshopName}
              onChange={(event) => setFormState((prev) => ({ ...prev, workshopName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              placeholder="Advanced Tech Web"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Workshop contact</span>
            <input
              type="text"
              value={formState.workshopContact}
              onChange={(event) => setFormState((prev) => ({ ...prev, workshopContact: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
              placeholder="Phone or email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Low stock threshold</span>
            <input
              type="number"
              min="1"
              max="999"
              value={formState.lowStockThreshold}
              onChange={(event) => setFormState((prev) => ({ ...prev, lowStockThreshold: Number(event.target.value) || 1 }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Used by dashboard and inventory low-stock indicators.</p>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Default reports period</span>
            <select
              value={formState.reportsDefaultPeriod}
              onChange={(event) => setFormState((prev) => ({ ...prev, reportsDefaultPeriod: event.target.value as AppSettings['reportsDefaultPeriod'] }))}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-950"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="custom">Date range</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={restoreDefaults}>Restore defaults</Button>
          <Button onClick={applySettings} disabled={!isDirty}>Save settings</Button>
        </div>
      </section>
    </div>
  )
}
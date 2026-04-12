interface ProfileReadonlyFieldProps {
  label: string
  value?: string | null
  hint?: string
}

export function ProfileReadonlyField({ label, value, hint }: ProfileReadonlyFieldProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-2 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-800 shadow-inner shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:shadow-black/20">
        {value || hint || 'Not provided'}
      </div>
    </div>
  )
}
import { ChangeEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  onErrorClear: () => void
  showPassword: boolean
  onToggleVisibility: () => void
  error?: string
  placeholder?: string
}

export function PasswordInput({
  label,
  value,
  onChange,
  onErrorClear,
  showPassword,
  onToggleVisibility,
  error,
  placeholder
}: PasswordInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="relative mt-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            onErrorClear()
          }}
          className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition dark:bg-slate-950 dark:text-slate-100 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800'
              : 'border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:focus:border-slate-500 dark:focus:ring-slate-800'
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </label>
  )
}

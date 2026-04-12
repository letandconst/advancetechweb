import { FormEvent, useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../../components'

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>
  onForgotPassword: () => void
  error?: string | null
  isLoading: boolean
}

export function LoginPage({ onLogin, onForgotPassword, error, isLoading }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Clear validation errors when component mounts (switching pages)
  useEffect(() => {
    setValidationErrors({})
  }, [])

  function validateForm() {
    const errors: Record<string, string> = {}

    if (!username.trim()) errors.username = 'Username is required'
    if (!password) errors.password = 'Password is required'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateForm()) return
    await onLogin(username, password)
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Sign in to your account to continue
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="johndoe"
            className={`mt-2 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
              validationErrors.username
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900'
                : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:focus:border-blue-400 dark:focus:ring-blue-900/30'
            }`}
          />
          {validationErrors.username && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.username}</p>
          )}
        </label>

        <div className="flex items-center justify-between">
          <label className="block flex-1">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                  validationErrors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:focus:border-blue-400 dark:focus:ring-blue-900/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
            )}
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading} variant="primary">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Account access is managed by your administrator.
      </p>
    </div>
  )
}



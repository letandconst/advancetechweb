import { FormEvent, useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '../../components'

interface ForgotPasswordPageProps {
  onReset: (email: string) => Promise<void>
  onBack: () => void
  error?: string | null
  isLoading: boolean
  success?: boolean
}

export function ForgotPasswordPage({
  onReset,
  onBack,
  error,
  isLoading,
  success
}: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  function validateForm() {
    const errors: Record<string, string> = {}

    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateForm()) return
    await onReset(email)
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Check your email</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            We've sent a password reset link to <span className="font-medium">{email}</span>. 
            Click the link in your email to reset your password.
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
            Didn't receive an email? Check your spam folder or try again.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Reset your password</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Enter the email address associated with your account, and we'll send you a link to reset your password.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={`mt-2 w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
              validationErrors.email
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900'
                : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:focus:border-blue-400 dark:focus:ring-blue-900/30'
            }`}
          />
          {validationErrors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
          )}
        </label>

        {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading} variant="primary">
          {isLoading ? 'Sending link…' : 'Send reset link'}
        </Button>
      </form>
    </div>
  )
}

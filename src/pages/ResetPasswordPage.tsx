import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components'
import { ROUTES } from '../constants'
import { supabase } from '../lib/supabase'

function getAuthUrlError() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)
  const errorDescription =
    params.get('error_description') || searchParams.get('error_description')

  if (errorDescription) {
    return errorDescription
  }

  const errorCode = params.get('error_code') || searchParams.get('error_code')
  if (errorCode === 'otp_expired') {
    return 'This reset link is invalid or has expired. Please request a new password reset link.'
  }

  return null
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [linkError, setLinkError] = useState<string | null>(() => getAuthUrlError())
  const [isSessionReady, setIsSessionReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadRecoverySession() {
      if (linkError) {
        return
      }

      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setLinkError(error.message)
        return
      }

      if (!data.session) {
        setLinkError('Password reset session was not found. Please request a new reset link.')
        return
      }

      setIsSessionReady(true)
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted || linkError) {
        return
      }

      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsSessionReady(true)
      }
    })

    loadRecoverySession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [linkError])

  function validateForm() {
    const errors: Record<string, string> = {}

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setLinkError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setLinkError(error.message)
      setIsLoading(false)
      return
    }

    await supabase.auth.signOut()
    window.history.replaceState({}, document.title, ROUTES.RESET_PASSWORD)
    setSuccess(true)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <Link
          to={ROUTES.LOGIN}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
          <Lock className="h-6 w-6 text-sky-600 dark:text-sky-400" />
        </div>

        <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-white">
          Create a new password
        </h2>

        {success ? (
          <div className="mt-6 space-y-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your password has been updated. Sign in with your new password to continue.
            </p>
            <Button type="button" className="w-full" onClick={() => navigate(ROUTES.LOGIN)}>
              Back to sign in
            </Button>
          </div>
        ) : linkError ? (
          <div className="mt-6 space-y-6">
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {linkError}
            </p>
            <Button type="button" className="w-full" onClick={() => navigate(ROUTES.LOGIN)}>
              Request a new link
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
              Enter your new password below.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  New password
                </span>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={!isSessionReady || isLoading}
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
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.password}
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm password
                </span>
                <div className="relative mt-2">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={!isSessionReady || isLoading}
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                      validationErrors.confirmPassword
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:focus:border-blue-400 dark:focus:ring-blue-900/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </label>

              <Button type="submit" className="w-full" disabled={!isSessionReady || isLoading}>
                {isLoading ? 'Updating password...' : 'Update password'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

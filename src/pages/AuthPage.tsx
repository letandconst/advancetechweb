import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginPage, SignupPage, ForgotPasswordPage } from '../modules/auth'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuth } from '../hooks'
import { supabase } from '../lib/supabase'

export function AuthPage() {
  const { user, isLoading, error, login, signup } = useAuth()
  const [page, setPage] = useState<'login' | 'signup' | 'forgot-password'>('login')
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading..." overlay />
  }

  async function handleForgotPassword(email: string) {
    setForgotPasswordLoading(true)
    setForgotPasswordError(null)
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setForgotPasswordError(resetError.message)
        return
      }

      setForgotPasswordSuccess(true)
    } catch (err) {
      setForgotPasswordError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      )
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        {page === 'login' ? (
          <LoginPage 
            onLogin={login} 
            onSwitch={() => setPage('signup')} 
            onForgotPassword={() => {
              setPage('forgot-password')
              setForgotPasswordSuccess(false)
              setForgotPasswordError(null)
            }}
            error={error} 
            isLoading={isLoading} 
          />
        ) : page === 'signup' ? (
          <SignupPage onSignup={signup} onSwitch={() => setPage('login')} error={error} isLoading={isLoading} />
        ) : (
          <ForgotPasswordPage 
            onReset={handleForgotPassword}
            onBack={() => {
              setPage('login')
              setForgotPasswordSuccess(false)
              setForgotPasswordError(null)
            }}
            isLoading={forgotPasswordLoading}
            error={forgotPasswordError}
            success={forgotPasswordSuccess}
          />
        )}
      </div>
    </div>
  )
}

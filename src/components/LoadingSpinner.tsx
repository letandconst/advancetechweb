import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  overlay?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({
  message = 'Loading...',
  overlay = false,
  size = 'md'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const containerClasses = overlay
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300'
    : 'flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-all duration-300'

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-6">
        {/* Modern animated spinner */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border-4 border-sky-200/50 dark:border-sky-800/50 animate-pulse"></div>
          {/* Middle ring */}
          <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-sky-400 border-r-sky-400 animate-spin"></div>
          {/* Inner spinning core */}
          <div className="relative rounded-full border-4 border-transparent border-t-sky-500 border-r-sky-500 animate-spin animation-reverse">
            <div className={`rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 shadow-lg ${sizeClasses[size]}`}></div>
          </div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white shadow-sm"></div>
          </div>
        </div>

        {/* Alternative using Lucide icon with custom styling */}
        {/* <div className="relative">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-sky-500`} />
          <div className="absolute inset-0 rounded-full border-2 border-sky-500/20 animate-ping"></div>
        </div> */}

        {message && (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 animate-pulse">
              {message}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1">
              <div className="h-1 w-1 animate-bounce rounded-full bg-sky-500"></div>
              <div className="h-1 w-1 animate-bounce rounded-full bg-sky-500 animation-delay-100"></div>
              <div className="h-1 w-1 animate-bounce rounded-full bg-sky-500 animation-delay-200"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
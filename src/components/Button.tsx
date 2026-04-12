import { ReactNode } from 'react'
import { cn } from '../utils/classNames'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl border font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary: 'border-blue-200 bg-blue-600 text-white shadow-md hover:bg-blue-700 dark:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-lg',
    secondary: 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    danger: 'border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60'
  }
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm'
  }

  return <button type="button" className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
}

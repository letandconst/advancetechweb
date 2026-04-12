import { ReactNode } from 'react'
import { cn } from '../utils/classNames'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl border font-medium transition-all duration-200 ease-out active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary: 'border-sky-700 bg-sky-600 text-white shadow-md hover:bg-sky-700 hover:shadow-lg dark:border-sky-800 dark:bg-sky-700 dark:hover:bg-sky-600 dark:shadow-lg',
    secondary: 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-sky-900/60 dark:hover:bg-sky-950/30 dark:hover:text-sky-300',
    danger: 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm hover:bg-amber-100 hover:shadow-md dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60'
  }
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm'
  }

  return <button type="button" className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />
}



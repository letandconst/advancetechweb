import { ReactNode } from 'react'
import { cn } from '../utils/classNames'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const baseStyles =
    'rounded-xl border font-medium transition px-4 py-3 text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'border-blue-200 bg-blue-600 text-white shadow-md hover:bg-blue-700 dark:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-lg',
    secondary: 'border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
  }

  return <button type="button" className={cn(baseStyles, variants[variant], className)} {...props} />
}

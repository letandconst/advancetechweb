import { ReactNode } from 'react'
import { cn } from '../../../utils/classNames'

interface ProfileSectionCardProps {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ProfileSectionCard({ title, description, action, children, className }: ProfileSectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90',
        className
      )}
    >
      <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
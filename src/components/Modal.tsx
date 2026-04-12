import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../utils/classNames'

interface ModalProps {
  isOpen: boolean
  title: string
  description?: string
  moduleLabel?: string
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ isOpen, title, description, moduleLabel, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_40px_120px_-48px_rgba(15,23,42,0.6)] dark:border-slate-800 dark:bg-slate-950',
          className
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Sticky header — never scrolls */}
        <div className="flex-shrink-0 border-b border-slate-100 px-6 py-5 dark:border-slate-800 sm:px-8 sm:py-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="pr-10">
            {moduleLabel && (
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-600 dark:text-sky-400">{moduleLabel}</p>
            )}
            <h2 id="modal-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
          </div>
        </div>

        {/* Scrollable body — overflow stays inside the rounded container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
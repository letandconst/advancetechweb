import { ReactNode, createContext, useContext, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../utils/classNames'

const DropdownContext = createContext<{ close: () => void } | null>(null)

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, children, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        {trigger}
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              'absolute top-full z-20 mt-2 min-w-[240px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900',
              align === 'left' ? 'left-0' : 'right-0'
            )}
          >
            <DropdownContext.Provider value={{ close: () => setIsOpen(false) }}>
              {children}
            </DropdownContext.Provider>
          </div>
        </>
      )}
    </div>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
}

export function DropdownItem({ children, onClick, icon }: DropdownItemProps) {
  const context = useContext(DropdownContext)

  function handleClick() {
    onClick?.()
    context?.close()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition-colors duration-200 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
    >
      {icon && <span className="flex-shrink-0 opacity-60">{icon}</span>}
      {children}
    </button>
  )
}



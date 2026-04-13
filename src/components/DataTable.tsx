import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from './index'
import { cn } from '../utils/classNames'

const ACTION_COLUMN_WIDTH = 220
const SCROLL_HINT_GAP = 16

const iconButtonClassName = 'h-11 w-11 rounded-full p-0 shadow-none'
const viewButtonClassName = `${iconButtonClassName} border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60 dark:hover:text-sky-200`
const editButtonClassName = `${iconButtonClassName} border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-200`
const deleteButtonClassName = `${iconButtonClassName} border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-200`

function detectTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
}

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, item: T) => ReactNode
  sortable?: boolean
}

interface CustomAction<T> {
  icon?: ReactNode
  label: string
  onClick: (item: T) => void
  variant?: 'primary' | 'secondary' | 'danger'
  hidden?: (item: T) => boolean
  showLabel?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  canView?: (item: T) => boolean
  canEdit?: (item: T) => boolean
  canDelete?: (item: T) => boolean
  customActions?: CustomAction<T>[]
  loading?: boolean
  emptyMessage?: string
  pageSize?: number
  enablePagination?: boolean
  paginationMode?: 'client' | 'server'
  currentPage?: number
  totalItems?: number
  onPageChange?: (page: number) => void
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  canView,
  canEdit,
  canDelete,
  customActions,
  loading = false,
  emptyMessage = 'No data available',
  pageSize = 10,
  enablePagination = true,
  paginationMode = 'client',
  currentPage,
  totalItems,
  onPageChange,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1)
  const [showHorizontalScrollHint, setShowHorizontalScrollHint] = useState(false)
  const [isTouchDevice] = useState(() => detectTouchDevice())
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const hasActions = Boolean(onView || onEdit || onDelete || customActions?.length)
  const stickyActionCellStyle = hasActions ? { minWidth: ACTION_COLUMN_WIDTH } : undefined
  const rightHintOffset = hasActions ? ACTION_COLUMN_WIDTH + SCROLL_HINT_GAP : 8
  const activePage = paginationMode === 'server' ? Math.max(currentPage ?? 1, 1) : internalPage
  const totalCount = paginationMode === 'server' ? (totalItems ?? 0) : data.length

  const totalPages = useMemo(() => {
    if (!enablePagination) {
      return 1
    }

    return Math.max(1, Math.ceil(totalCount / pageSize))
  }, [totalCount, enablePagination, pageSize])

  useEffect(() => {
    if (paginationMode === 'client' && internalPage > totalPages) {
      setInternalPage(totalPages)
    }
  }, [internalPage, paginationMode, totalPages])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const activeContainer = container

    function updateHorizontalHint() {
      const hasOverflow = activeContainer.scrollWidth > activeContainer.clientWidth + 1
      const hasHiddenContentOnRight = activeContainer.scrollLeft + activeContainer.clientWidth < activeContainer.scrollWidth - 1
      setShowHorizontalScrollHint(hasOverflow && hasHiddenContentOnRight)
    }

    updateHorizontalHint()
    activeContainer.addEventListener('scroll', updateHorizontalHint, { passive: true })
    window.addEventListener('resize', updateHorizontalHint)

    return () => {
      activeContainer.removeEventListener('scroll', updateHorizontalHint)
      window.removeEventListener('resize', updateHorizontalHint)
    }
  }, [columns, data, hasActions])

  const paginatedData = useMemo(() => {
    if (!enablePagination) {
      return data
    }

    if (paginationMode === 'server') {
      return data
    }

    const startIndex = (activePage - 1) * pageSize
    return data.slice(startIndex, startIndex + pageSize)
  }, [activePage, data, enablePagination, pageSize, paginationMode])

  const startItem = totalCount === 0 ? 0 : (activePage - 1) * pageSize + 1
  const endItem = enablePagination
    ? Math.min(activePage * pageSize, totalCount)
    : totalCount

  function goToPreviousPage() {
    const nextPage = Math.max(activePage - 1, 1)
    if (paginationMode === 'server') {
      onPageChange?.(nextPage)
      return
    }

    setInternalPage(nextPage)
  }

  function goToNextPage() {
    const nextPage = Math.min(activePage + 1, totalPages)
    if (paginationMode === 'server') {
      onPageChange?.(nextPage)
      return
    }

    setInternalPage(nextPage)
  }

  function showAction(predicate: ((item: T) => boolean) | undefined, item: T) {
    return predicate ? predicate(item) : true
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <div ref={scrollContainerRef} className="relative overflow-x-auto">
        {showHorizontalScrollHint && (
          <>
            <div className={cn(
              'pointer-events-none absolute bottom-0 top-0 z-20 w-14 bg-gradient-to-l from-white/95 to-transparent dark:from-slate-900/95',
            )} style={{ right: hasActions ? ACTION_COLUMN_WIDTH : 0 }} />
            <div className={cn(
              'pointer-events-none absolute top-2 z-30 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              'border-slate-300 bg-white/95 text-slate-600 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300',
            )} style={{ right: rightHintOffset }}>
              {isTouchDevice ? 'Swipe to see more ->' : 'Scroll horizontally ->'}
            </div>
          </>
        )}
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {hasActions && (
                <th className="sticky right-0 z-20 border-l border-slate-200 bg-slate-50 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 shadow-[-1px_0_0_0_rgba(226,232,240,1)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:shadow-[-1px_0_0_0_rgba(30,41,59,1)]" style={stickyActionCellStyle}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedData.map((item) => (
              <tr key={item.id} className="group transition-colors duration-200 hover:bg-sky-50/60 dark:hover:bg-sky-950/20">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {column.render
                      ? column.render(item[column.key as keyof T], item)
                      : String(item[column.key as keyof T] || '')
                    }
                  </td>
                ))}
                {hasActions && (
                  <td className={cn(
                    'sticky right-0 z-10 border-l border-slate-200 px-6 py-4 text-sm font-medium shadow-[-1px_0_0_0_rgba(226,232,240,1)] transition-colors duration-200 dark:border-slate-700 dark:shadow-[-1px_0_0_0_rgba(30,41,59,1)]',
                    'bg-white group-hover:bg-sky-50/60 dark:bg-slate-900 dark:group-hover:bg-sky-950/20'
                  )} style={stickyActionCellStyle}>
                    <div className="flex items-center gap-2">
                      {onView && showAction(canView, item) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onView(item)}
                          aria-label="View"
                          title="View"
                          className={viewButtonClassName}
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                      )}
                      {onEdit && showAction(canEdit, item) && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(item)}
                          aria-label="Edit"
                          title="Edit"
                          className={editButtonClassName}
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                      )}
                      {onDelete && showAction(canDelete, item) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(item)}
                          aria-label="Delete"
                          title="Delete"
                          className={deleteButtonClassName}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                      {customActions?.map((action, index) => {
                        const isHidden = action.hidden?.(item)
                        if (isHidden) return null
                        return (
                          <Button
                            key={index}
                            variant={action.variant ?? 'secondary'}
                            size="sm"
                            onClick={() => action.onClick(item)}
                            aria-label={action.label}
                            title={action.label}
                            className={action.showLabel ? undefined : iconButtonClassName}
                          >
                            {action.icon ? (
                              action.showLabel ? (
                                <span className="flex items-center gap-1">
                                  {action.icon}
                                  {action.label && <span>{action.label}</span>}
                                </span>
                              ) : (
                                action.icon
                              )
                            ) : action.showLabel ? (
                              action.label
                            ) : null}
                          </Button>
                        )
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enablePagination && (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {startItem}-{endItem} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToPreviousPage}
              disabled={activePage === 1}
            >
              Previous
            </Button>
            <span className="min-w-[110px] text-center font-medium text-slate-700 dark:text-slate-300">
              Page {activePage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={activePage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}


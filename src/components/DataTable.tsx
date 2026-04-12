import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Button } from './index'

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
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onView?: (item: T) => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="rounded-[24px] border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto">
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
              {(onView || onEdit || onDelete || customActions?.length) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    {column.render
                      ? column.render(item[column.key as keyof T], item)
                      : String(item[column.key as keyof T] || '')
                    }
                  </td>
                ))}
                {(onView || onEdit || onDelete || customActions?.length) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {onView && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onView(item)}
                        >
                          View
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(item)}
                        >
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(item)}
                        >
                          Delete
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
                            title={action.label}
                          >
                            {action.icon ? (
                              <span className="flex items-center gap-1">
                                {action.icon}
                                {action.label && <span>{action.label}</span>}
                              </span>
                            ) : (
                              action.label
                            )}
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
            Showing {startItem}-{endItem} of {data.length}
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
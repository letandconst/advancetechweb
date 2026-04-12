import { X, Printer } from 'lucide-react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../../components'
import { JobOrder } from '../../../types'
import { JobOrderPrintReceipt } from './JobOrderPrintReceipt'

interface JobOrderPrintModalProps {
  isOpen: boolean
  jobOrder: JobOrder
  onClose: () => void
}

export function JobOrderPrintModal({ isOpen, jobOrder, onClose }: JobOrderPrintModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  function handlePrint() {
    if (!contentRef.current) return

    // Get the receipt HTML
    const receiptHtml = contentRef.current.innerHTML

    // Create a new window
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Write the content to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              margin: 0;
              padding: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
          </style>
        </head>
        <body>
          <div class="flex items-center justify-center p-4">
            ${receiptHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Sticky */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 p-6 print:hidden dark:border-slate-800 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Print Receipt</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto p-6">
            <JobOrderPrintReceipt jobOrder={jobOrder} />
          </div>

          {/* Footer - Sticky */}
          <div className="flex flex-shrink-0 justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 print:hidden dark:border-slate-800 dark:bg-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}

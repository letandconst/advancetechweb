import { JobOrder } from '../types'

interface JobOrderPrintReceiptProps {
  jobOrder: JobOrder
}

function formatPhpCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function JobOrderPrintReceipt({ jobOrder }: JobOrderPrintReceiptProps) {
  return (
    <div className="w-full max-w-2xl bg-white p-6 text-slate-900">
      {/* Header */}
      <div className="mb-4 border-b-2 border-slate-900 pb-3 text-center">
        <h1 className="text-xl font-bold">ADVANCEDTECH CAR SERVICE CENTER</h1>
        <p className="mt-0.5 text-xs font-semibold">formerly ANTE MOTOR SHOP</p>
        <p className="text-xs text-slate-600">National Hi-Way, Balagtas, Batangas City</p>
        <p className="text-xs text-slate-600">Tel.No.: 784-7471 | Cell. No: 0917-504-8461 / 0908-664-5308</p>
      </div>

      {/* Receipt # */}
      <div className="mb-4 border-b border-slate-200 pb-3 text-center">
        <p className="text-sm font-semibold text-slate-700">Receipt #: {jobOrder.job_order_code}</p>
      </div>

      {/* Customer Info */}
      <div className="mb-4 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-600">Customer</p>
        <p className="mt-1 text-sm">{jobOrder.customer_name}</p>
        <p className="text-slate-600">{jobOrder.customer_address}</p>
      </div>

      {/* Vehicle Info */}
      <div className="mb-4 text-xs">
        <p className="font-semibold uppercase tracking-wide text-slate-600">Vehicle</p>
        <p className="mt-1 text-sm">{jobOrder.vehicle_make} • {jobOrder.plate_number}</p>
      </div>

      {/* Date & Mechanic */}
      <div className="mb-4 grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 text-xs">
        <div>
          <p className="font-semibold uppercase tracking-wide text-slate-600">Date</p>
          <p className="mt-1 text-sm">{formatDate(jobOrder.job_date)}</p>
        </div>
        <div>
          <p className="font-semibold uppercase tracking-wide text-slate-600">Mechanic</p>
          <p className="mt-1 text-sm">{jobOrder.mechanic_name || 'N/A'}</p>
        </div>
      </div>

      {/* Work Requested */}
      {jobOrder.work_requested && jobOrder.work_requested.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Work Requested</p>
          <div className="space-y-1 text-xs">
            {jobOrder.work_requested.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 border-b border-slate-100 py-1">
                <p className="flex-1">{item.service_name}</p>
                <p className="font-medium">{formatPhpCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oil & Fluids */}
      {jobOrder.oil_and_fuels && jobOrder.oil_and_fuels.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Oil & Fluids</p>
          <div className="space-y-0 text-xs">
            {jobOrder.oil_and_fuels.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_40px_55px_60px] gap-1 border-b border-slate-100 py-1">
                <p className="truncate text-xs">{item.item_name}</p>
                <p className="text-right">×{item.quantity}</p>
                <p className="text-right text-slate-600">{formatPhpCurrency(item.unit_price)}</p>
                <p className="text-right font-medium">{formatPhpCurrency(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parts */}
      {jobOrder.parts && jobOrder.parts.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Parts</p>
          <div className="space-y-0 text-xs">
            {jobOrder.parts.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_40px_55px_60px] gap-1 border-b border-slate-100 py-1">
                <p className="truncate text-xs">{item.item_name}</p>
                <p className="text-right">×{item.quantity}</p>
                <p className="text-right text-slate-600">{formatPhpCurrency(item.unit_price)}</p>
                <p className="text-right font-medium">{formatPhpCurrency(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mb-4 space-y-1 border-y border-slate-200 py-3 text-xs">
        <div className="flex justify-between">
          <p>Labor</p>
          <p className="font-medium">{formatPhpCurrency(jobOrder.labor_total)}</p>
        </div>
        <div className="flex justify-between">
          <p>Oil & Fluids</p>
          <p className="font-medium">{formatPhpCurrency(jobOrder.oil_fuel_total)}</p>
        </div>
        <div className="flex justify-between">
          <p>Parts</p>
          <p className="font-medium">{formatPhpCurrency(jobOrder.parts_total)}</p>
        </div>
        <div className="flex justify-between font-semibold">
          <p>Subtotal</p>
          <p>{formatPhpCurrency(jobOrder.subtotal)}</p>
        </div>
      </div>

      {/* Discount */}
      {jobOrder.discount_amount > 0 && (
        <div className="mb-4 flex justify-between border-b border-slate-200 py-2 text-xs">
          <p>
            Discount
            {jobOrder.discount_type === 'percentage' ? ` (${jobOrder.discount_value}%)` : ''}
          </p>
          <p className="font-medium">-{formatPhpCurrency(jobOrder.discount_amount)}</p>
        </div>
      )}

      {/* Total */}
      <div className="mb-6 flex justify-between border-b-2 border-slate-900 py-3">
        <p className="font-bold">TOTAL</p>
        <p className="font-bold">{formatPhpCurrency(jobOrder.total)}</p>
      </div>

      {/* Footer */}
      <div className="space-y-0.5 text-center text-xs text-slate-600">
        <p>Thank you for your business!</p>
        <p className="text-xs">Receipt Generated: {formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  )
}

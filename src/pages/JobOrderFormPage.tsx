import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, LoadingSpinner } from '../components'
import { ROUTES } from '../constants'
import {
  JobOrderForm,
  JobOrderFormData,
  useCreateJobOrder,
  useFluidInventoryOptions,
  useJobOrder,
  useMechanicOptions,
  useNextJobOrderCode,
  usePartsInventoryOptions,
  useServiceOptions,
  useUpdateJobOrder,
} from '../modules/job-orders'

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function buildDefaultFormData(jobOrderCode: string): JobOrderFormData {
  return {
    job_order_code: jobOrderCode,
    job_date: todayDateString(),
    customer_name: '',
    customer_address: '',
    vehicle_make: '',
    plate_number: '',
    mechanic_id: null,
    mechanic_name: null,
    status: 'draft',
    work_requested: [],
    oil_and_fuels: [],
    parts: [],
    labor_total: 0,
    oil_fuel_total: 0,
    parts_total: 0,
    subtotal: 0,
    discount_type: 'none',
    discount_value: 0,
    discount_amount: 0,
    total: 0,
  }
}

export function JobOrderFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  const { data: nextCode, isLoading: isLoadingCode, error: codeError } = useNextJobOrderCode()
  const { data: jobOrder, isLoading: isLoadingJobOrder, error: jobOrderError } = useJobOrder(id)
  const { data: mechanics, isLoading: isLoadingMechanics } = useMechanicOptions()
  const { data: services, isLoading: isLoadingServices } = useServiceOptions()
  const { data: fluidOptions, isLoading: isLoadingFluids } = useFluidInventoryOptions()
  const { data: partOptions, isLoading: isLoadingParts } = usePartsInventoryOptions()

  const createJobOrder = useCreateJobOrder()
  const updateJobOrder = useUpdateJobOrder()

  const isLoading =
    isLoadingMechanics ||
    isLoadingServices ||
    isLoadingFluids ||
    isLoadingParts ||
    (isEditMode ? isLoadingJobOrder : isLoadingCode)

  const hasError = codeError || jobOrderError

  async function handleSubmit(data: JobOrderFormData) {
    try {
      if (isEditMode && id && jobOrder) {
        await updateJobOrder.mutateAsync({ ...data, id, previousStatus: jobOrder.status })
      } else {
        await createJobOrder.mutateAsync(data)
      }

      navigate(ROUTES.JOB_ORDERS)
    } catch {
      // Mutations already expose failures via rejected promise; page-level status is handled by parent patterns.
    }
  }

  if (isLoading) {
    return <LoadingSpinner message={isEditMode ? 'Loading job order...' : 'Preparing new job order...'} />
  }

  if (hasError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-slate-100">Unable to open job order form</h3>
          <p className="text-slate-600 dark:text-slate-400">{(codeError || jobOrderError)?.message}</p>
          <Button className="mt-4" onClick={() => navigate(ROUTES.JOB_ORDERS)}>Back to Job Orders</Button>
        </div>
      </div>
    )
  }

  const baseData = isEditMode && jobOrder
    ? ({ ...jobOrder, inventory_consumed_at: undefined } as unknown as JobOrderFormData)
    : buildDefaultFormData(nextCode ?? 'JO-00001')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.JOB_ORDERS)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to job orders
        </Button>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.94))] p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_34%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-300">Workshop operations</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          {isEditMode ? 'Edit job order' : 'Create job order'}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Fill in customer details, labor items, oils, and parts. Totals and discount are calculated automatically.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <JobOrderForm
          mode={isEditMode ? 'edit' : 'create'}
          initialData={baseData}
          mechanics={mechanics ?? []}
          services={services ?? []}
          fluidOptions={fluidOptions ?? []}
          partOptions={partOptions ?? []}
          loading={createJobOrder.isPending || updateJobOrder.isPending}
          onSubmit={handleSubmit}
          onCancel={() => navigate(ROUTES.JOB_ORDERS)}
        />
      </section>
    </div>
  )
}

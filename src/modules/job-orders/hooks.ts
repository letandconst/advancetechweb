import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { InventoryItem, Mechanic, Service } from '../../types'
import { JobOrder, JobOrderFormData, JobOrderInventoryItem, JobOrderStatus } from './types'

export interface JobOrderFilters {
  search?: string
  status?: 'all' | JobOrderStatus
  mechanicId?: string
}

export interface JobOrderListParams {
  page?: number
  pageSize?: number
  filters?: JobOrderFilters
}

export interface JobOrderListResult {
  items: JobOrder[]
  totalCount: number
  page: number
  pageSize: number
}

function parseCodeSequence(code: string) {
  const match = code.match(/JO-(\d+)/)
  return match ? Number(match[1]) : 0
}

function formatCode(sequence: number) {
  return `JO-${sequence.toString().padStart(5, '0')}`
}

async function ensureCustomerReferences(payload: JobOrderFormData): Promise<JobOrderFormData> {
  // If linked already, preserve explicit selections.
  if (payload.customer_id) return payload

  const customerName = payload.customer_name.trim()
  const customerAddress = payload.customer_address.trim()
  if (!customerName || !customerAddress) return payload

  const { data: existingCustomer, error: existingCustomerError } = await supabase
    .from('customers')
    .select('id')
    .eq('customer_name', customerName)
    .eq('address', customerAddress)
    .limit(1)
    .maybeSingle()

  if (existingCustomerError) throw existingCustomerError

  let customerId = existingCustomer?.id ?? null

  if (!customerId) {
    const { data: createdCustomer, error: createCustomerError } = await supabase
      .from('customers')
      .insert({
        customer_name: customerName,
        address: customerAddress,
      })
      .select('id')
      .single()

    if (createCustomerError) throw createCustomerError
    customerId = createdCustomer.id
  }

  // Also try to persist vehicle details for manual entry when complete.
  const carMake = payload.vehicle_make.trim()
  const carModel = payload.vehicle_model?.trim() ?? ''
  const plateNumber = payload.plate_number.trim().toUpperCase()
  const vehicleYear = payload.vehicle_year

  let customerVehicleId = payload.customer_vehicle_id ?? null

  if (!customerVehicleId && carMake && carModel && plateNumber && vehicleYear) {
    const { data: existingVehicle, error: existingVehicleError } = await supabase
      .from('customer_vehicles')
      .select('id, customer_id')
      .eq('plate_number', plateNumber)
      .limit(1)
      .maybeSingle()

    if (existingVehicleError) throw existingVehicleError

    if (existingVehicle) {
      customerVehicleId = existingVehicle.id
      customerId = existingVehicle.customer_id
    } else {
      const { data: createdVehicle, error: createVehicleError } = await supabase
        .from('customer_vehicles')
        .insert({
          customer_id: customerId,
          car_make: carMake,
          car_model: carModel,
          year: vehicleYear,
          plate_number: plateNumber,
          is_primary: false,
        })
        .select('id')
        .single()

      if (createVehicleError) throw createVehicleError
      customerVehicleId = createdVehicle.id
    }
  }

  return {
    ...payload,
    customer_id: customerId,
    customer_vehicle_id: customerVehicleId,
  }
}

async function consumeInventory(items: JobOrderInventoryItem[], jobOrderId: string) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const grouped = items.reduce<Record<string, number>>((acc, item) => {
    // Ad-hoc rows are stored in job order JSON but do not map to inventory stock.
    if (!uuidPattern.test(item.inventory_item_id)) return acc

    acc[item.inventory_item_id] = (acc[item.inventory_item_id] ?? 0) + Math.max(item.quantity, 0)
    return acc
  }, {})

  const entries = Object.entries(grouped)
  for (const [inventoryId, quantityToConsume] of entries) {
    if (quantityToConsume <= 0) continue

    const { data: current, error: fetchError } = await supabase
      .from('inventory_items')
      .select('id, amount, name')
      .eq('id', inventoryId)
      .single()

    if (fetchError) throw fetchError

    const currentAmount = current?.amount ?? 0
    if (currentAmount < quantityToConsume) {
      throw new Error('Insufficient stock for one or more items. Please restock before setting to in progress.')
    }

    const nextAmount = currentAmount - quantityToConsume

    // Update inventory
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ amount: nextAmount })
      .eq('id', inventoryId)

    if (updateError) throw updateError

    // Log the deduction
    const { error: logError } = await supabase
      .from('inventory_logs')
      .insert({
        inventory_item_id: inventoryId,
        inventory_item_name: current?.name ?? 'Unknown',
        movement_type: 'auto-deduct',
        quantity_changed: -quantityToConsume,
        quantity_before: currentAmount,
        quantity_after: nextAmount,
        reference_type: 'job-order',
        reference_id: jobOrderId,
      })

    if (logError) throw logError
  }
}

export function useJobOrders(params: JobOrderListParams = {}) {
  const page = Math.max(params.page ?? 1, 1)
  const pageSize = Math.max(params.pageSize ?? 10, 1)
  const filters = params.filters ?? {}

  return useQuery({
    queryKey: ['job-orders', { page, pageSize, filters }],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('job_orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      const search = filters.search?.trim()
      if (search) {
        query = query.or(`job_order_code.ilike.%${search}%,customer_name.ilike.%${search}%,plate_number.ilike.%${search}%,vehicle_make.ilike.%${search}%`)
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.mechanicId && filters.mechanicId !== 'all') {
        query = query.eq('mechanic_id', filters.mechanicId)
      }

      const { data, error, count } = await query
      if (error) throw error

      return {
        items: (data ?? []) as JobOrder[],
        totalCount: count ?? 0,
        page,
        pageSize,
      } as JobOrderListResult
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useJobOrder(id?: string) {
  return useQuery({
    queryKey: ['job-order', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_orders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as JobOrder
    },
  })
}

export function useNextJobOrderCode() {
  return useQuery({
    queryKey: ['job-orders-next-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_orders')
        .select('job_order_code')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      const lastSequence = data?.job_order_code ? parseCodeSequence(data.job_order_code) : 0
      return formatCode(lastSequence + 1)
    },
  })
}

export function useMechanicOptions() {
  return useQuery({
    queryKey: ['job-orders', 'mechanic-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanics')
        .select('id, name, status')
        .order('name', { ascending: true })

      if (error) throw error
      return ((data ?? []) as Mechanic[]).filter((mechanic) => mechanic.status === 'active')
    },
  })
}

export function useServiceOptions() {
  return useQuery({
    queryKey: ['job-orders', 'service-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, status, description, created_at, updated_at')
        .order('name', { ascending: true })

      if (error) throw error
      return ((data ?? []) as Service[]).filter((service) => service.status === 'active')
    },
  })
}

export function useFluidInventoryOptions() {
  return useQuery({
    queryKey: ['job-orders', 'inventory-fluids-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('category', 'Fluids')
        .order('name', { ascending: true })

      if (error) throw error
      return (data ?? []) as InventoryItem[]
    },
  })
}

export function usePartsInventoryOptions() {
  return useQuery({
    queryKey: ['job-orders', 'inventory-parts-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .neq('category', 'Fluids')
        .order('name', { ascending: true })

      if (error) throw error
      return (data ?? []) as InventoryItem[]
    },
  })
}

export function useCreateJobOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: JobOrderFormData) => {
      const hydratedPayload = await ensureCustomerReferences(payload)

      const insertPayload = {
        ...hydratedPayload,
        inventory_consumed_at: hydratedPayload.status === 'in_progress' ? new Date().toISOString() : null,
      }

      const { data, error } = await supabase
        .from('job_orders')
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error

      // Consume inventory and create logs after job order is created
      if (hydratedPayload.status === 'in_progress') {
        await consumeInventory([...(hydratedPayload.oil_and_fuels ?? []), ...(hydratedPayload.parts ?? [])], data.id)
      }

      return data as JobOrder
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['job-order'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent-jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['reports-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
      ])
    },
  })
}

export function useUpdateJobOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, previousStatus, ...payload }: JobOrderFormData & { id: string; previousStatus: JobOrderStatus }) => {
      const hydratedPayload = await ensureCustomerReferences(payload)
      const shouldConsume = previousStatus !== 'in_progress' && hydratedPayload.status === 'in_progress'

      const updatePayload = {
        ...hydratedPayload,
        inventory_consumed_at: shouldConsume ? new Date().toISOString() : undefined,
      }

      const { data, error } = await supabase
        .from('job_orders')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Consume inventory and create logs after job order is updated
      if (shouldConsume) {
        await consumeInventory([...(hydratedPayload.oil_and_fuels ?? []), ...(hydratedPayload.parts ?? [])], id)
      }

      return data as JobOrder
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['job-order'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-logs'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent-jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-low-stock'] }),
        queryClient.invalidateQueries({ queryKey: ['reports-analytics'] }),
        queryClient.invalidateQueries({ queryKey: ['customers'] }),
      ])
    },
  })
}

export function useDeleteJobOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_orders')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['job-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['job-order'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-recent-jobs'] }),
        queryClient.invalidateQueries({ queryKey: ['reports-analytics'] }),
      ])
    },
  })
}

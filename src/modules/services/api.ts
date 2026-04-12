import { supabase } from '../../lib/supabase'
import { getSupabaseDataOrThrow, getSupabaseListOrEmpty, getSupabaseCountOrZero } from '../../lib/supabaseRequest'
import { Service, ServiceFormData } from './types'

export interface ServiceFiltersInput {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  minPrice?: number | null
  maxPrice?: number | null
}

export interface ServiceListResultInput {
  items: Service[]
  totalCount: number
  page: number
  pageSize: number
}

export async function listServices(params: {
  page: number
  pageSize: number
  filters: ServiceFiltersInput
}): Promise<ServiceListResultInput> {
  const from = (params.page - 1) * params.pageSize
  const to = from + params.pageSize - 1

  let query = supabase
    .from('services')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const search = params.filters.search?.trim()
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (params.filters.status && params.filters.status !== 'all') {
    query = query.eq('status', params.filters.status)
  }

  if (typeof params.filters.minPrice === 'number' && !Number.isNaN(params.filters.minPrice)) {
    query = query.gte('price', params.filters.minPrice)
  }

  if (typeof params.filters.maxPrice === 'number' && !Number.isNaN(params.filters.maxPrice)) {
    query = query.lte('price', params.filters.maxPrice)
  }

  const result = await query

  return {
    items: getSupabaseListOrEmpty(result, 'Failed to load services') as Service[],
    totalCount: getSupabaseCountOrZero(result, 'Failed to count services'),
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function createService(service: ServiceFormData): Promise<Service> {
  const result = await supabase
    .from('services')
    .insert(service)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to create service') as Service
}

export async function updateService(payload: Partial<ServiceFormData> & { id: string }): Promise<Service> {
  const { id, ...updates } = payload

  const result = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to update service') as Service
}

export async function deactivateService(id: string): Promise<Service> {
  const result = await supabase
    .from('services')
    .update({ status: 'inactive' })
    .eq('id', id)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to deactivate service') as Service
}

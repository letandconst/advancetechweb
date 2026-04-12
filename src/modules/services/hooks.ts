import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Service, ServiceFormData } from './types'

export interface ServiceFilters {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  minPrice?: number | null
  maxPrice?: number | null
}

export interface ServiceListParams {
  page?: number
  pageSize?: number
  filters?: ServiceFilters
}

export interface ServiceListResult {
  items: Service[]
  totalCount: number
  page: number
  pageSize: number
}

export function useServices(params: ServiceListParams = {}) {
  const page = Math.max(params.page ?? 1, 1)
  const pageSize = Math.max(params.pageSize ?? 10, 1)
  const filters = params.filters ?? {}

  return useQuery({
    queryKey: ['services', { page, pageSize, filters }],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('services')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      const search = filters.search?.trim()
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (typeof filters.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
        query = query.gte('price', filters.minPrice)
      }

      if (typeof filters.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
        query = query.lte('price', filters.maxPrice)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        items: (data ?? []) as Service[],
        totalCount: count ?? 0,
        page,
        pageSize,
      } as ServiceListResult
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (service: ServiceFormData) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()

      if (error) throw error
      return data as Service
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Service
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useDeactivateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('services')
        .update({ status: 'inactive' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Service
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

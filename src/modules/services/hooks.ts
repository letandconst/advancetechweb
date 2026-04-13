import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { createService, createServicesBulk, deactivateService, listServices, updateService } from './api'
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
    queryKey: queryKeys.services({ page, pageSize, filters }),
    queryFn: () => listServices({ page, pageSize, filters }),
    placeholderData: (previousData) => previousData,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useBulkCreateServices() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createServicesBulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

export function useDeactivateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })
}

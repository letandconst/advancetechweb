import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCustomer,
  deleteCustomer,
  deleteCustomerVehicle,
  listCustomerJobOrderHistory,
  listCustomersWithVehicles,
  listVehicleMakes,
  listVehicleModels,
  updateCustomer,
  upsertCustomerVehicle,
} from './api'

export function useCustomers(search = '') {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: () => listCustomersWithVehicles(search),
  })
}

export function useVehicleMakes(search = '') {
  return useQuery({
    queryKey: ['vehicle-makes', search],
    queryFn: () => listVehicleMakes(search),
  })
}

export function useVehicleModels(makeId: string, search = '') {
  return useQuery({
    queryKey: ['vehicle-models', makeId, search],
    queryFn: () => listVehicleModels(makeId, search),
    enabled: Boolean(makeId),
  })
}

export function useCustomerJobOrderHistory(customerId: string) {
  return useQuery({
    queryKey: ['customers', 'history', customerId],
    queryFn: () => listCustomerJobOrderHistory(customerId),
    enabled: Boolean(customerId),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpsertCustomerVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: upsertCustomerVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useDeleteCustomerVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomerVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

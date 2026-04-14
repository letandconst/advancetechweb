import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { createMechanic, deactivateMechanic, listMechanics, updateMechanic } from './api'
import { Mechanic, MechanicFormData } from './types'

async function invalidateMechanicRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.mechanics }),
    queryClient.invalidateQueries({ queryKey: ['job-orders', 'mechanic-options'] }),
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
  ])
}

export function useMechanics() {
  return useQuery({
    queryKey: queryKeys.mechanics,
    queryFn: listMechanics,
  })
}

export function useCreateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMechanic,
    onSuccess: () => {
      return invalidateMechanicRelatedQueries(queryClient)
    },
  })
}

export function useUpdateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMechanic,
    onSuccess: () => {
      return invalidateMechanicRelatedQueries(queryClient)
    },
  })
}

export function useDeactivateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateMechanic,
    onSuccess: () => {
      return invalidateMechanicRelatedQueries(queryClient)
    },
  })
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMechanic, deactivateMechanic, listMechanics, updateMechanic } from './api'
import { Mechanic, MechanicFormData } from './types'

export function useMechanics() {
  return useQuery({
    queryKey: ['mechanics'],
    queryFn: listMechanics,
  })
}

export function useCreateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMechanic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
    },
  })
}

export function useUpdateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMechanic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
    },
  })
}

export function useDeactivateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateMechanic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
    },
  })
}
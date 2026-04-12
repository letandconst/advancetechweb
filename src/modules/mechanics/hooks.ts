import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Mechanic, MechanicFormData } from './types'

export function useMechanics() {
  return useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mechanics')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Mechanic[]
    },
  })
}

export function useCreateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mechanic: MechanicFormData) => {
      const { data, error } = await supabase
        .from('mechanics')
        .insert(mechanic)
        .select()
        .single()

      if (error) throw error
      return data as Mechanic
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
    },
  })
}

export function useUpdateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MechanicFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('mechanics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Mechanic
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
    },
  })
}

export function useDeactivateMechanic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('mechanics')
        .update({ status: 'inactive' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Mechanic
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanics'] })
    },
  })
}
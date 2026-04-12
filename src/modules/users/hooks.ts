import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { AppUser, UserFormData } from './types'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username, first_name, last_name, role')
        .order('first_name', { ascending: true })

      if (error) throw error

      const users = (data ?? []).map((item) => ({
        id: item.id,
        email: item.email ?? '',
        username: item.username ?? '',
        first_name: item.first_name ?? '',
        last_name: item.last_name ?? '',
        role: item.role === 'admin' ? 'admin' : 'user',
      }))

      return users as AppUser[]
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UserFormData & { password: string }) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const currentSession = sessionData.session

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            username: payload.username,
            first_name: payload.first_name,
            last_name: payload.last_name,
          },
        },
      })

      if (signupError) {
        throw signupError
      }

      const createdUserId = signupData.user?.id ?? signupData.session?.user?.id
      if (!createdUserId) {
        throw new Error('Failed to create user account.')
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: createdUserId,
            email: payload.email,
            username: payload.username,
            first_name: payload.first_name,
            last_name: payload.last_name,
            role: payload.role,
          },
          { onConflict: 'id' }
        )
        .select('id, email, username, first_name, last_name, role')
        .single()

      if (error) throw error

      if (currentSession) {
        await supabase.auth.setSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        })
      }

      return data as AppUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Omit<UserFormData, 'password'> & { id: string }) => {
      const { data, error } = await supabase.rpc('admin_update_user', {
        target_user_id: id,
        new_email: updates.email,
        new_username: updates.username,
        new_first_name: updates.first_name,
        new_last_name: updates.last_name,
        new_role: updates.role,
      })

      if (error) throw error

      return {
        id: data.id,
        email: data.email ?? '',
        username: data.username ?? '',
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        role: data.role === 'admin' ? 'admin' : 'user',
      } as AppUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: id })

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

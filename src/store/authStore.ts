import { create } from 'zustand'

export interface UserProfile {
  id: string
  email?: string
  username?: string
  first_name?: string
  last_name?: string
  full_name?: string
  avatar_url?: string | null
  role: string | null
}

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (message: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ user: null, error: null })
}))

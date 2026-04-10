import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

interface ProfileRow {
  id: string
  email?: string
  username?: string
  first_name?: string
  last_name?: string
  full_name?: string
  avatar_url?: string | null
  role: string | null
}

async function fetchUserProfile(userId: string, email?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, username, first_name, last_name, avatar_url, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return {
      profile: {
        id: userId,
        email,
        username: undefined,
        first_name: undefined,
        last_name: undefined,
        full_name: undefined,
        avatar_url: null,
        role: null
      } as ProfileRow,
      error
    }
  }

  // If no profile exists, return default profile
  if (!data) {
    return {
      profile: {
        id: userId,
        email,
        username: undefined,
        first_name: undefined,
        last_name: undefined,
        full_name: undefined,
        avatar_url: null,
        role: null
      } as ProfileRow,
      error: null
    }
  }

  const computedFullName =
    [data.first_name, data.last_name].filter(Boolean).join(' ').trim() ||
    undefined

  return {
    profile: {
      id: data.id,
      email: data.email ?? email,
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: computedFullName,
      avatar_url: data.avatar_url,
      role: data.role
    } as ProfileRow,
    error: null
  }
}

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)
  const setError = useAuthStore((state) => state.setError)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  async function loadProfile(userId: string, email?: string) {
    const { profile, error: profileError } = await fetchUserProfile(userId, email)

    if (profileError) {
      setError(profileError.message)
    }

    setUser(profile)
  }

  async function handleSession(session: any) {
    if (!session?.user?.id) {
      clearAuth()
      setLoading(false)
      return
    }

    setError(null)
    await loadProfile(session.user.id, session.user.email ?? undefined)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)

    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function login(username: string, password: string) {
    setLoading(true)
    setError(null)

    // First, get the email from the profiles table using username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle()

    if (profileError || !profile?.email) {
      setError('Invalid username or password')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const userId = data.session?.user?.id
    if (!userId) {
      setError('Unable to sign in. Please try again.')
      setLoading(false)
      return
    }

    await loadProfile(userId, profile.email)
    setLoading(false)
  }

  async function signup(
    email: string,
    password: string,
    username: string,
    firstName: string,
    lastName: string
  ) {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstName,
          last_name: lastName
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id ?? data.session?.user?.id

    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email,
          username,
          first_name: firstName,
          last_name: lastName,
          avatar_url: null,
          role: 'user'
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        setError(profileError.message)
      }

      if (data.session?.user?.id) {
        await loadProfile(userId, email)
      }
    }

    setLoading(false)
  }

  async function logout() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    clearAuth()
    setLoading(false)
  }

  async function updateProfile(updates: {
    avatar_url?: string | null
  }) {
    setLoading(true)
    setError(null)

    if (!user?.id) {
      setError('Unable to update profile. User is not authenticated.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setUser({
      ...user,
      avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : user.avatar_url
    })

    setLoading(false)
  }

  async function updatePassword(newPassword: string) {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
  }

  const getCurrentUser = () => user
  const getRole = () => user?.role ?? null
  const isAdmin = () => user?.role === 'admin'

  return {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    updatePassword,
    getCurrentUser,
    getRole,
    isAdmin
  }
}

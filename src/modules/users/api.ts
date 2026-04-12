import { supabase } from '../../lib/supabase'
import { ensureNoSupabaseError, getSupabaseDataOrThrow, getSupabaseListOrEmpty } from '../../lib/supabaseRequest'
import { AppUser, UserFormData } from './types'

type ProfileRow = {
  id: string
  email: string | null
  username: string | null
  first_name: string | null
  last_name: string | null
  role: string | null
}

function mapProfileToUser(row: ProfileRow): AppUser {
  return {
    id: row.id,
    email: row.email ?? '',
    username: row.username ?? '',
    first_name: row.first_name ?? '',
    last_name: row.last_name ?? '',
    role: row.role === 'admin' ? 'admin' : 'user',
  }
}

export async function listUsers(): Promise<AppUser[]> {
  const result = await supabase
    .from('profiles')
    .select('id, email, username, first_name, last_name, role')
    .order('first_name', { ascending: true })

  const rows = getSupabaseListOrEmpty(result, 'Failed to load users') as ProfileRow[]
  return rows.map(mapProfileToUser)
}

export async function createUser(payload: UserFormData & { password: string }): Promise<AppUser> {
  const sessionResult = await supabase.auth.getSession()
  ensureNoSupabaseError(sessionResult, 'Failed to read current admin session')
  const currentSession = sessionResult.data.session

  const signUpResult = await supabase.auth.signUp({
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

  ensureNoSupabaseError(signUpResult, 'Failed to create auth user')

  const createdUserId = signUpResult.data.user?.id ?? signUpResult.data.session?.user?.id
  if (!createdUserId) {
    throw new Error('Failed to create user account: missing user id in signup response.')
  }

  const profileResult = await supabase
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

  const createdProfile = getSupabaseDataOrThrow(profileResult, 'Failed to upsert created user profile') as ProfileRow

  if (currentSession) {
    const restoreSessionResult = await supabase.auth.setSession({
      access_token: currentSession.access_token,
      refresh_token: currentSession.refresh_token,
    })
    ensureNoSupabaseError(restoreSessionResult, 'Failed to restore current admin session after user creation')
  }

  return mapProfileToUser(createdProfile)
}

export async function updateUser(payload: Omit<UserFormData, 'password'> & { id: string }): Promise<AppUser> {
  const result = await supabase.rpc('admin_update_user', {
    target_user_id: payload.id,
    new_email: payload.email,
    new_username: payload.username,
    new_first_name: payload.first_name,
    new_last_name: payload.last_name,
    new_role: payload.role,
  })

  const data = getSupabaseDataOrThrow(result, 'Failed to update user') as ProfileRow
  return mapProfileToUser(data)
}

export async function deleteUser(id: string): Promise<string> {
  const result = await supabase.rpc('admin_delete_user', { target_user_id: id })
  ensureNoSupabaseError(result, 'Failed to delete user')
  return id
}

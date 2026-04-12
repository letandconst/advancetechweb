import { supabase } from '../../lib/supabase'
import { getSupabaseDataOrThrow, getSupabaseListOrEmpty } from '../../lib/supabaseRequest'
import { Mechanic, MechanicFormData } from './types'

export async function listMechanics(): Promise<Mechanic[]> {
  const result = await supabase
    .from('mechanics')
    .select('*')
    .order('created_at', { ascending: false })

  return getSupabaseListOrEmpty(result, 'Failed to load mechanics') as Mechanic[]
}

export async function createMechanic(payload: MechanicFormData): Promise<Mechanic> {
  const result = await supabase
    .from('mechanics')
    .insert(payload)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to create mechanic') as Mechanic
}

export async function updateMechanic(payload: Partial<MechanicFormData> & { id: string }): Promise<Mechanic> {
  const { id, ...updates } = payload

  const result = await supabase
    .from('mechanics')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to update mechanic') as Mechanic
}

export async function deactivateMechanic(id: string): Promise<Mechanic> {
  const result = await supabase
    .from('mechanics')
    .update({ status: 'inactive' })
    .eq('id', id)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to deactivate mechanic') as Mechanic
}

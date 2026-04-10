import { supabase } from './supabase'

const AVATARS_BUCKET = 'avatars'

export async function uploadImageToSupabase(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { error: uploadError } = await supabase.storage.from(AVATARS_BUCKET).upload(filePath, file, {
    upsert: true
  })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(filePath)

  return data.publicUrl
}

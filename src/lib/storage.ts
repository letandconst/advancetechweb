import { STORAGE_BUCKETS } from '../constants'
import { supabase } from './supabase'

const AVATARS_BUCKET = STORAGE_BUCKETS.profileAvatars
const SIGNED_URL_TTL_SECONDS = 60 * 60

function isBrowserSafeUrl(value: string) {
  return value.startsWith('blob:') || value.startsWith('data:')
}

function getAvatarFilePath(pathOrUrl: string) {
  const trimmedValue = pathOrUrl.trim()

  if (!trimmedValue || isBrowserSafeUrl(trimmedValue)) {
    return null
  }

  try {
    const parsedUrl = new URL(trimmedValue)
    const storagePrefixes = [
      `/storage/v1/object/sign/${AVATARS_BUCKET}/`,
      `/storage/v1/object/public/${AVATARS_BUCKET}/`
    ]

    const matchingPrefix = storagePrefixes.find((prefix) => parsedUrl.pathname.startsWith(prefix))

    if (!matchingPrefix) {
      return null
    }

    return decodeURIComponent(parsedUrl.pathname.slice(matchingPrefix.length))
  } catch {
    return trimmedValue.replace(/^\/+/, '')
  }
}

async function createAvatarSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to create signed URL')
  }

  return data.signedUrl
}

export async function uploadImageToSupabase(file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser()


  if (!user) {
    throw new Error('User not authenticated')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  // 1. Upload file
  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  return filePath
}

export async function resolveAvatarUrl(pathOrUrl: string) {
  if (isBrowserSafeUrl(pathOrUrl)) {
    return pathOrUrl
  }

  const filePath = getAvatarFilePath(pathOrUrl)

  if (!filePath) {
    return pathOrUrl
  }

  return createAvatarSignedUrl(filePath)
}

// ─── Mechanic avatars ────────────────────────────────────────────────────────

const MECHANIC_AVATARS_BUCKET = STORAGE_BUCKETS.mechanicAvatars

export async function uploadMechanicImageToSupabase(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const fileExt = file.name.split('.').pop()
  const filePath = `mechanics/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(MECHANIC_AVATARS_BUCKET)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  return filePath
}

export async function resolveMechanicAvatarUrl(pathOrUrl: string): Promise<string> {
  if (isBrowserSafeUrl(pathOrUrl)) {
    return pathOrUrl
  }

  const trimmed = pathOrUrl.trim()
  if (!trimmed) {
    return pathOrUrl
  }

  let filePath: string
  try {
    const parsedUrl = new URL(trimmed)
    const prefixes = [
      `/storage/v1/object/sign/${MECHANIC_AVATARS_BUCKET}/`,
      `/storage/v1/object/public/${MECHANIC_AVATARS_BUCKET}/`,
    ]
    const match = prefixes.find((p) => parsedUrl.pathname.startsWith(p))
    filePath = match
      ? decodeURIComponent(parsedUrl.pathname.slice(match.length))
      : trimmed.replace(/^\/+/, '')
  } catch {
    filePath = trimmed.replace(/^\/+/, '')
  }

  const { data, error } = await supabase.storage
    .from(MECHANIC_AVATARS_BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to create signed URL')
  }

  return data.signedUrl
}
import { useEffect, useState } from 'react'
import { resolveAvatarUrl } from '../lib/storage'

function isImmediateAvatarUrl(value: string) {
  return value.startsWith('blob:') || value.startsWith('data:')
}

const avatarUrlCache = new Map<string, string>()

export function useAvatarUrl(avatarValue?: string | null) {
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(() => {
    if (!avatarValue) return null
    if (isImmediateAvatarUrl(avatarValue)) return avatarValue
    return avatarUrlCache.get(avatarValue) ?? null
  })

  useEffect(() => {
    let isActive = true

    if (!avatarValue) {
      setResolvedAvatarUrl(null)
      return () => {
        isActive = false
      }
    }

    if (isImmediateAvatarUrl(avatarValue)) {
      avatarUrlCache.set(avatarValue, avatarValue)
      setResolvedAvatarUrl(avatarValue)
      return () => {
        isActive = false
      }
    }

    const cachedUrl = avatarUrlCache.get(avatarValue)
    if (cachedUrl) {
      setResolvedAvatarUrl(cachedUrl)
      return () => {
        isActive = false
      }
    }

    setResolvedAvatarUrl(null)

    resolveAvatarUrl(avatarValue)
      .then((url) => {
        if (isActive) {
          avatarUrlCache.set(avatarValue, url)
          setResolvedAvatarUrl(url)
        }
      })
      .catch(() => {
        if (isActive) {
          avatarUrlCache.set(avatarValue, avatarValue)
          setResolvedAvatarUrl(avatarValue)
        }
      })

    return () => {
      isActive = false
    }
  }, [avatarValue])

  return resolvedAvatarUrl
}
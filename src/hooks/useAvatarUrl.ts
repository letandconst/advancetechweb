import { useEffect, useState } from 'react'
import { resolveAvatarUrl } from '../lib/storage'

function isImmediateAvatarUrl(value: string) {
  return value.startsWith('blob:') || value.startsWith('data:')
}

export function useAvatarUrl(avatarValue?: string | null) {
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    if (!avatarValue) {
      setResolvedAvatarUrl(null)
      return () => {
        isActive = false
      }
    }

    if (isImmediateAvatarUrl(avatarValue)) {
      setResolvedAvatarUrl(avatarValue)
      return () => {
        isActive = false
      }
    }

    setResolvedAvatarUrl(null)

    resolveAvatarUrl(avatarValue)
      .then((url) => {
        if (isActive) {
          setResolvedAvatarUrl(url)
        }
      })
      .catch(() => {
        if (isActive) {
          setResolvedAvatarUrl(avatarValue)
        }
      })

    return () => {
      isActive = false
    }
  }, [avatarValue])

  return resolvedAvatarUrl
}
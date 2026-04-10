import { useEffect } from 'react'
import { useUIStore } from '../store'
import { storage } from '../utils/storage'
import { STORAGE_KEYS } from '../constants'

export function useDarkMode() {
  const darkMode = useUIStore((state) => state.darkMode)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)

  useEffect(() => {
    const stored = storage.get(STORAGE_KEYS.darkMode)
    const preferred = stored ? stored === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches

    useUIStore.setState({ darkMode: preferred })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    storage.set(STORAGE_KEYS.darkMode, String(darkMode))
  }, [darkMode])

  return { darkMode, toggleDarkMode }
}

import { useMemo, useState } from 'react'
import { APP_NAME, LOW_STOCK_THRESHOLD, STORAGE_KEYS } from '../../constants'
import { storage } from '../../utils/storage'
import { AppSettings } from './types'

const DEFAULT_SETTINGS: AppSettings = {
  workshopName: APP_NAME,
  workshopContact: '',
  lowStockThreshold: LOW_STOCK_THRESHOLD,
  reportsDefaultPeriod: 'month',
}

function sanitizeSettings(input: Partial<AppSettings> | null | undefined): AppSettings {
  const safeThreshold = Math.max(1, Math.min(999, Number(input?.lowStockThreshold ?? DEFAULT_SETTINGS.lowStockThreshold) || DEFAULT_SETTINGS.lowStockThreshold))
  const safePeriod = ['day', 'month', 'year', 'custom'].includes(String(input?.reportsDefaultPeriod))
    ? (input?.reportsDefaultPeriod as AppSettings['reportsDefaultPeriod'])
    : DEFAULT_SETTINGS.reportsDefaultPeriod

  return {
    workshopName: (input?.workshopName || DEFAULT_SETTINGS.workshopName).trim() || DEFAULT_SETTINGS.workshopName,
    workshopContact: (input?.workshopContact || '').trim(),
    lowStockThreshold: safeThreshold,
    reportsDefaultPeriod: safePeriod,
  }
}

function loadInitialSettings(): AppSettings {
  const raw = storage.get(STORAGE_KEYS.appSettings)
  if (!raw) return DEFAULT_SETTINGS

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return sanitizeSettings(parsed)
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadInitialSettings())

  function updateSettings(next: Partial<AppSettings>) {
    setSettings((current) => {
      const merged = sanitizeSettings({ ...current, ...next })
      storage.set(STORAGE_KEYS.appSettings, JSON.stringify(merged))
      return merged
    })
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS)
    storage.set(STORAGE_KEYS.appSettings, JSON.stringify(DEFAULT_SETTINGS))
  }

  return useMemo(
    () => ({ settings, updateSettings, resetSettings, defaults: DEFAULT_SETTINGS }),
    [settings]
  )
}

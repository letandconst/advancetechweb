export const APP_NAME = 'Advanced Tech Web'
export const STORAGE_KEYS = {
  darkMode: 'advanced-tech-dark-mode'
} as const

export const STORAGE_BUCKETS = {
  profileAvatars: 'avatars',
  mechanicAvatars: 'mechanic-avatars'
} as const

export const THEME = {
  colors: {
    light: {
      bg: 'bg-slate-50',
      text: 'text-slate-900'
    },
    dark: {
      bg: 'dark:bg-slate-950',
      text: 'dark:text-slate-100'
    }
  }
} as const

export const ROUTES = {
  DASHBOARD: '/',
  JOB_ORDERS: '/job-orders',
  MECHANICS: '/mechanics',
  SERVICES: '/services',
  INVENTORY: '/inventory',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  LOGIN: '/login'
} as const

export const SERVICE_SPECIALIZATIONS = [
  'Power Steering',
  'Engine Electrical',
  'Fuel Injected Engine',
  'Engine Overhaul',
  'Repair Computer Box',
  'Under Chassis',
  'Engine Scan'
] as const

export const INVENTORY_CATEGORIES = [
  'Engine Parts',
  'Electrical',
  'Fluids',
  'Filters',
  'Brakes',
  'Suspension',
  'Tires',
  'Tools',
  'Consumables',
  'Other'
] as const

export const LOW_STOCK_THRESHOLD = 5

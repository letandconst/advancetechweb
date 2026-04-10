/**
 * Shared type definitions for the application
 */

export type ThemeMode = 'light' | 'dark'

export type UserSession = {
  userId: string
  email?: string
}

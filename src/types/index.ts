/**
 * Shared type definitions for the application
 */

export type ThemeMode = 'light' | 'dark'

export type UserSession = {
  userId: string
  email?: string
}

export type Mechanic = {
  id: string
  name: string
  birthday: string // ISO date string
  address: string
  phone_number: string
  status: 'active' | 'inactive'
  image?: string | null
  specialization: string
  emergency_contact_person: string
  emergency_contact_phone: string
  created_at: string
  updated_at: string
}

export type MechanicFormData = Omit<Mechanic, 'id' | 'created_at' | 'updated_at'>

export type Service = {
  id: string
  name: string
  description: string
  price: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type ServiceFormData = Omit<Service, 'id' | 'created_at' | 'updated_at'>

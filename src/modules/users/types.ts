export type UserRole = 'admin' | 'user'

export interface AppUser {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  role: UserRole
}

export interface UserFormData {
  email: string
  username: string
  first_name: string
  last_name: string
  role: UserRole
  password?: string
}

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

export type InventoryItem = {
  id: string
  name: string
  description: string
  price: number
  cost?: number | null // Supplier/landed cost per unit
  amount: number
  category: string
  unit_type?: string // 'piece', 'liter', 'kg', 'box', etc.
  cost_updated_at?: string // When cost was last updated
  created_at: string
  updated_at: string
}

export type InventoryFormData = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>

export type InventoryMovementType = 'restock' | 'auto-deduct'
export type InventoryLogReferenceType = 'manual' | 'job-order'

export type InventoryLog = {
  id: string
  inventory_item_id: string
  inventory_item_name: string
  movement_type: InventoryMovementType
  quantity_changed: number
  quantity_before: number
  quantity_after: number
  reference_type: InventoryLogReferenceType
  reference_id: string | null
  reference_label: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type JobOrderStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled'
export type JobOrderDiscountType = 'none' | 'fixed' | 'percentage'

export type JobOrderWorkItem = {
  id: string
  service_name: string
  amount: number
}

export type JobOrderInventoryItem = {
  id: string
  inventory_item_id: string
  item_name: string
  category: string
  quantity: number
  unit_price: number
}

export type JobOrder = {
  id: string
  job_order_code: string
  job_date: string
  customer_name: string
  customer_address: string
  vehicle_make: string
  plate_number: string
  mechanic_id: string | null
  mechanic_name: string | null
  status: JobOrderStatus
  work_requested: JobOrderWorkItem[]
  oil_and_fuels: JobOrderInventoryItem[]
  parts: JobOrderInventoryItem[]
  labor_total: number
  oil_fuel_total: number
  parts_total: number
  subtotal: number
  discount_type: JobOrderDiscountType
  discount_value: number
  discount_amount: number
  total: number
  inventory_consumed_at: string | null
  created_at: string
  updated_at: string
}

export type JobOrderFormData = Omit<JobOrder, 'id' | 'created_at' | 'updated_at' | 'inventory_consumed_at'>

export type {
  Customer,
  CustomerFormData,
  CustomerVehicle,
  CustomerVehicleFormData,
  VehicleMake,
  VehicleModel,
} from '../../types'

export type CustomerWithVehicles = {
  id: string
  customer_name: string
  address: string
  phone_number?: string | null
  vehicles: Array<{
    id: string
    car_make: string
    car_model: string
    year: number
    plate_number: string
    is_primary: boolean
  }>
  created_at: string
  updated_at: string
}

export type CustomerJobOrderHistoryRow = {
  id: string
  job_order_code: string
  job_date: string
  vehicle_make: string
  vehicle_model: string | null
  vehicle_year: number | null
  plate_number: string
  total: number
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled'
}

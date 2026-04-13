import { supabase } from '../../lib/supabase'
import { getSupabaseDataOrThrow, getSupabaseListOrEmpty } from '../../lib/supabaseRequest'
import { Customer, VehicleMake, VehicleModel } from '../../types'
import { CustomerJobOrderHistoryRow, CustomerWithVehicles } from './types'

export async function listCustomersWithVehicles(search = ''): Promise<CustomerWithVehicles[]> {
  let customersQuery = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  const keyword = search.trim()
  if (keyword) {
    customersQuery = customersQuery.or(`customer_name.ilike.%${keyword}%,address.ilike.%${keyword}%`)
  }

  const customersResult = await customersQuery
  const customers = getSupabaseListOrEmpty(customersResult, 'Failed to load customers') as Customer[]

  if (!customers.length) return []

  const ids = customers.map((customer) => customer.id)
  const vehiclesResult = await supabase
    .from('customer_vehicles')
    .select('id, customer_id, car_make, car_model, year, plate_number, is_primary')
    .in('customer_id', ids)
    .order('created_at', { ascending: true })

  const vehicles = getSupabaseListOrEmpty(vehiclesResult, 'Failed to load customer vehicles') as Array<{
    id: string
    customer_id: string
    car_make: string
    car_model: string
    year: number
    plate_number: string
    is_primary: boolean
  }>

  return customers.map((customer) => ({
    ...customer,
    vehicles: vehicles.filter((vehicle) => vehicle.customer_id === customer.id),
  }))
}

export async function createCustomer(payload: { customer_name: string; address: string }): Promise<Customer> {
  const result = await supabase
    .from('customers')
    .insert(payload)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to create customer') as Customer
}

export async function updateCustomer(payload: { id: string; customer_name: string; address: string }): Promise<Customer> {
  const { id, ...updates } = payload
  const result = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return getSupabaseDataOrThrow(result, 'Failed to update customer') as Customer
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

export async function upsertCustomerVehicle(payload: {
  id?: string
  customer_id: string
  car_make: string
  car_model: string
  year: number
  plate_number: string
  is_primary?: boolean
}): Promise<void> {
  if (payload.id) {
    const { id, ...updates } = payload
    const { error } = await supabase.from('customer_vehicles').update(updates).eq('id', id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('customer_vehicles').insert(payload)
  if (error) throw error
}

export async function deleteCustomerVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('customer_vehicles').delete().eq('id', id)
  if (error) throw error
}

export async function listVehicleMakes(search = ''): Promise<VehicleMake[]> {
  let query = supabase
    .from('vehicle_makes')
    .select('id, name, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  const keyword = search.trim()
  if (keyword) {
    query = query.ilike('name', `%${keyword}%`)
  }

  const result = await query
  return getSupabaseListOrEmpty(result, 'Failed to load vehicle makes') as VehicleMake[]
}

export async function listVehicleModels(makeId: string, search = ''): Promise<VehicleModel[]> {
  if (!makeId) return []

  let query = supabase
    .from('vehicle_models')
    .select('id, make_id, name, is_active')
    .eq('is_active', true)
    .eq('make_id', makeId)
    .order('name', { ascending: true })

  const keyword = search.trim()
  if (keyword) {
    query = query.ilike('name', `%${keyword}%`)
  }

  const result = await query
  return getSupabaseListOrEmpty(result, 'Failed to load vehicle models') as VehicleModel[]
}

export async function listCustomerJobOrderHistory(customerId: string): Promise<CustomerJobOrderHistoryRow[]> {
  if (!customerId) return []

  const result = await supabase
    .from('job_orders')
    .select('id, job_order_code, job_date, vehicle_make, vehicle_model, vehicle_year, plate_number, total, status')
    .eq('customer_id', customerId)
    .order('job_date', { ascending: false })

  return getSupabaseListOrEmpty(result, 'Failed to load customer job order history') as CustomerJobOrderHistoryRow[]
}

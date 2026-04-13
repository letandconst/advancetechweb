export {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useUpsertCustomerVehicle,
  useDeleteCustomerVehicle,
  useVehicleMakes,
  useVehicleModels,
  useCustomerJobOrderHistory,
} from './hooks'

export type { CustomerWithVehicles, CustomerJobOrderHistoryRow } from './types'

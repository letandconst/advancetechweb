export type SettingsReportsPeriod = 'day' | 'month' | 'year' | 'custom'

export interface AppSettings {
  workshopName: string
  workshopContact: string
  lowStockThreshold: number
  reportsDefaultPeriod: SettingsReportsPeriod
}

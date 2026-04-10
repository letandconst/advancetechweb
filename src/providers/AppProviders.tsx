import { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { useDarkMode } from '../hooks/useDarkMode'

interface AppProvidersProps {
  children: ReactNode
}

function DarkModeInitializer() {
  useDarkMode()
  return null
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeInitializer />
      {children}
    </QueryClientProvider>
  )
}

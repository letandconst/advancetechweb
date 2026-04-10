import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  darkMode: boolean
  toggleSidebar: () => void
  toggleDarkMode: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  darkMode: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode }))
}))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('exceljs')) {
            return 'exceljs'
          }

          if (id.includes('xlsx')) {
            return 'spreadsheet'
          }

          return undefined
        },
      },
    },
  },
  server: {
    port: 4173
  }
})

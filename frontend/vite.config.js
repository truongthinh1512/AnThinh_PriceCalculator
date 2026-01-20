import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Default to local backend, change to your Render URL later
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

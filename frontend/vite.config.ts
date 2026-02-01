import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/run': 'http://localhost:8787',
      '/report': 'http://localhost:8787',
      '/seed': 'http://localhost:8787',
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: true
  }
})
